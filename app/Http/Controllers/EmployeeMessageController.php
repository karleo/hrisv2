<?php

namespace App\Http\Controllers;

use App\Events\EmployeeMessageRead;
use App\Events\EmployeeMessageSent;
use App\Http\Requests\EmployeeMessage\StoreEmployeeMessageRequest;
use App\Models\Employee;
use App\Models\EmployeeConversation;
use App\Models\EmployeeMessage;
use App\Support\CompanyAccessScope;
use App\Support\EmployeeMessages\EmployeeMessagesHeaderData;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class EmployeeMessageController extends Controller
{
    public function __construct(private readonly CompanyAccessScope $companyScope) {}

    public function header(Request $request): JsonResponse
    {
        $user = $request->user();
        $employee = $user?->employee;

        if ($employee === null || ! $user?->isAccountActive()) {
            return response()->json([
                'unread_count' => 0,
                'conversations' => [],
            ]);
        }

        return response()->json(
            app(EmployeeMessagesHeaderData::class)->forEmployee($employee),
        );
    }

    public function index(Request $request): Response
    {
        $employee = $this->currentEmployee($request);
        $selectedConversationId = $request->integer('conversation');
        $selectedConversation = null;
        $messages = collect();

        if (is_int($selectedConversationId) && $selectedConversationId > 0) {
            $selectedConversation = EmployeeConversation::query()
                ->forEmployee($employee->id)
                ->with([
                    'employeeOne.department',
                    'employeeOne.jobPosition',
                    'employeeTwo.department',
                    'employeeTwo.jobPosition',
                    'lastMessage',
                ])
                ->withCount([
                    'messages as unread_messages_count' => fn (Builder $query) => $query
                        ->where('recipient_employee_id', $employee->id)
                        ->whereNull('read_at'),
                ])
                ->whereKey($selectedConversationId)
                ->firstOrFail();

            $messages = $this->messagesPayload($selectedConversation);
        }

        return Inertia::render('employee-messages/index', [
            'currentEmployee' => $this->employeePayload($employee),
            'conversations' => $this->conversationList($employee),
            'selectedConversation' => $selectedConversation instanceof EmployeeConversation
                ? $this->conversationPayload($selectedConversation, $employee)
                : null,
            'messages' => $messages,
        ]);
    }

    public function searchEmployees(Request $request): JsonResponse
    {
        $employee = $this->currentEmployee($request);
        $keyword = trim((string) $request->query('q', ''));

        $employees = $this->activeLinkedEmployeeQuery($request->user())
            ->whereKeyNot($employee->id)
            ->when($keyword !== '', function ($query) use ($keyword): void {
                $query->where(function ($query) use ($keyword): void {
                    $query
                        ->where('employee_code', 'like', "%{$keyword}%")
                        ->orWhere('first_name', 'like', "%{$keyword}%")
                        ->orWhere('last_name', 'like', "%{$keyword}%")
                        ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$keyword}%"])
                        ->orWhereHas('department', fn ($query) => $query->where('name', 'like', "%{$keyword}%"))
                        ->orWhereHas('jobPosition', fn ($query) => $query->where('name', 'like', "%{$keyword}%"));
                });
            })
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->limit(20)
            ->get()
            ->map(fn (Employee $employee) => $this->employeePayload($employee))
            ->values();

        return response()->json(['employees' => $employees]);
    }

    public function showConversation(Request $request, EmployeeConversation $conversation): JsonResponse
    {
        $employee = $this->currentEmployee($request);
        $this->abortUnlessParticipant($conversation, $employee->id);

        return response()->json([
            'conversation' => $this->conversationPayload($conversation, $employee),
            'messages' => $this->messagesPayload($conversation),
        ]);
    }

    public function showEmployee(Request $request, Employee $employee): JsonResponse
    {
        $currentEmployee = $this->currentEmployee($request);
        $this->abortUnlessActiveLinkedEmployee($employee, $request->user());

        if ($employee->id === $currentEmployee->id) {
            abort(422);
        }

        $conversation = $this->findConversation($currentEmployee->id, $employee->id);

        return response()->json([
            'conversation' => $conversation instanceof EmployeeConversation
                ? $this->conversationPayload($conversation, $currentEmployee)
                : [
                    'id' => null,
                    'employee' => $this->employeePayload($employee),
                    'last_message' => null,
                    'last_message_at' => null,
                    'unread_count' => 0,
                ],
            'messages' => $conversation instanceof EmployeeConversation
                ? $this->messagesPayload($conversation)
                : [],
        ]);
    }

    public function store(StoreEmployeeMessageRequest $request): JsonResponse
    {
        $sender = $this->currentEmployee($request);
        $recipient = Employee::query()->findOrFail((int) $request->integer('recipient_employee_id'));
        $this->abortUnlessActiveLinkedEmployee($recipient, $request->user());

        if ($recipient->id === $sender->id) {
            abort(422);
        }

        $body = trim((string) $request->string('body'));
        $bodyForStore = $body !== '' ? $body : 'Sent an attachment.';

        $attachmentPath = null;
        $attachmentOriginalName = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentOriginalName = $file->getClientOriginalName();
            $attachmentPath = $file->store('employee-message-attachments', 'public');
        }

        [$conversation, $message] = DB::transaction(function () use ($sender, $recipient, $bodyForStore, $attachmentPath, $attachmentOriginalName): array {
            $conversation = $this->findOrCreateConversation($sender->id, $recipient->id);

            $message = EmployeeMessage::query()->create([
                'conversation_id' => $conversation->id,
                'sender_employee_id' => $sender->id,
                'recipient_employee_id' => $recipient->id,
                'body' => $bodyForStore,
                'attachment_path' => $attachmentPath,
                'attachment_original_name' => $attachmentOriginalName,
            ]);

            $conversation->forceFill([
                'last_message_id' => $message->id,
                'last_message_at' => $message->created_at,
            ])->save();

            return [$conversation, $message];
        });

        $conversation->refresh();
        $message->load(['sender.department', 'sender.jobPosition', 'recipient']);

        try {
            broadcast(new EmployeeMessageSent(
                message: $this->messagePayload($message),
                conversation: $this->conversationPayload($conversation, $recipient),
                recipientEmployeeId: $recipient->id,
            ))->toOthers();
        } catch (Throwable $e) {
            report($e);
        }

        return response()->json([
            'message' => $this->messagePayload($message),
            'conversation' => $this->conversationPayload($conversation, $sender),
            'client_message_id' => $request->input('client_message_id'),
        ], 201);
    }

    public function markRead(Request $request, EmployeeConversation $conversation): JsonResponse
    {
        $employee = $this->currentEmployee($request);
        $this->abortUnlessParticipant($conversation, $employee->id);

        $readAt = now();
        $messages = $conversation
            ->messages()
            ->where('recipient_employee_id', $employee->id)
            ->whereNull('read_at')
            ->get();

        if ($messages->isNotEmpty()) {
            EmployeeMessage::query()
                ->whereKey($messages->pluck('id'))
                ->update(['read_at' => $readAt]);

            $senderEmployeeId = $conversation->otherEmployeeId($employee->id);

            try {
                broadcast(new EmployeeMessageRead(
                    conversationId: $conversation->id,
                    readerEmployeeId: $employee->id,
                    senderEmployeeId: $senderEmployeeId,
                    messageIds: $messages->pluck('id')->map(fn ($id) => (int) $id)->all(),
                    readAt: $readAt->toIso8601String(),
                ))->toOthers();
            } catch (Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'read_at' => $readAt->toIso8601String(),
            'message_ids' => $messages->pluck('id')->map(fn ($id) => (int) $id)->all(),
        ]);
    }

    private function currentEmployee(Request $request): Employee
    {
        $employee = $request->user()?->employee;

        if (! $employee instanceof Employee || ! $request->user()?->isAccountActive()) {
            abort(403);
        }

        return $employee->loadMissing(['department', 'jobPosition', 'user']);
    }

    private function activeLinkedEmployeeQuery(?\App\Models\User $user): Builder
    {
        return $this->companyScope->scopeEmployees(
            Employee::query()
                ->with(['department', 'jobPosition', 'user'])
                ->whereHas('user', fn ($query) => $query->where('is_active', true)),
            $user,
        );
    }

    private function abortUnlessActiveLinkedEmployee(Employee $employee, ?\App\Models\User $user): void
    {
        if (! $employee->user()->where('is_active', true)->exists()) {
            abort(404);
        }

        if (! $this->companyScope->canAccessEmployee($user, $employee)) {
            abort(404);
        }
    }

    private function abortUnlessParticipant(EmployeeConversation $conversation, int $employeeId): void
    {
        if (! in_array($employeeId, [$conversation->employee_one_id, $conversation->employee_two_id], true)) {
            abort(404);
        }
    }

    private function findConversation(int $employeeAId, int $employeeBId): ?EmployeeConversation
    {
        [$employeeOneId, $employeeTwoId] = EmployeeConversation::orderedEmployeePair($employeeAId, $employeeBId);

        return EmployeeConversation::query()
            ->where('employee_one_id', $employeeOneId)
            ->where('employee_two_id', $employeeTwoId)
            ->first();
    }

    private function findOrCreateConversation(int $employeeAId, int $employeeBId): EmployeeConversation
    {
        [$employeeOneId, $employeeTwoId] = EmployeeConversation::orderedEmployeePair($employeeAId, $employeeBId);

        return EmployeeConversation::query()->firstOrCreate([
            'employee_one_id' => $employeeOneId,
            'employee_two_id' => $employeeTwoId,
        ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function conversationList(Employee $employee): Collection
    {
        return EmployeeConversation::query()
            ->forEmployee($employee->id)
            ->with(['employeeOne.department', 'employeeOne.jobPosition', 'employeeTwo.department', 'employeeTwo.jobPosition', 'lastMessage'])
            ->withCount([
                'messages as unread_messages_count' => fn (Builder $query) => $query
                    ->where('recipient_employee_id', $employee->id)
                    ->whereNull('read_at'),
            ])
            ->orderByDesc('last_message_at')
            ->limit(50)
            ->get()
            ->map(fn (EmployeeConversation $conversation) => $this->conversationPayload($conversation, $employee))
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function conversationPayload(EmployeeConversation $conversation, Employee $viewer): array
    {
        $conversation->loadMissing(['employeeOne.department', 'employeeOne.jobPosition', 'employeeTwo.department', 'employeeTwo.jobPosition', 'lastMessage']);
        $other = $conversation->employee_one_id === $viewer->id
            ? $conversation->employeeTwo
            : $conversation->employeeOne;

        $unreadCount = $conversation->getAttribute('unread_messages_count');

        return [
            'id' => $conversation->id,
            'employee' => $this->employeePayload($other),
            'last_message' => $conversation->lastMessage ? $this->messagePayload($conversation->lastMessage) : null,
            'last_message_at' => $conversation->last_message_at?->toIso8601String(),
            'unread_count' => is_numeric($unreadCount)
                ? (int) $unreadCount
                : $conversation->messages()
                    ->where('recipient_employee_id', $viewer->id)
                    ->whereNull('read_at')
                    ->count(),
        ];
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function messagesPayload(EmployeeConversation $conversation): Collection
    {
        return $conversation
            ->messages()
            ->with(['sender.department', 'sender.jobPosition', 'recipient'])
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->values()
            ->map(fn (EmployeeMessage $message) => $this->messagePayload($message));
    }

    /**
     * @return array<string, mixed>
     */
    private function messagePayload(EmployeeMessage $message): array
    {
        $path = $message->attachment_path;

        return [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_employee_id' => $message->sender_employee_id,
            'recipient_employee_id' => $message->recipient_employee_id,
            'body' => $message->body,
            'read_at' => $message->read_at?->toIso8601String(),
            'created_at' => $message->created_at?->toIso8601String(),
            'attachment_url' => is_string($path) && $path !== ''
                ? '/storage/'.ltrim($path, '/')
                : null,
            'attachment_original_name' => $message->attachment_original_name,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function employeePayload(Employee $employee): array
    {
        $employee->loadMissing(['department', 'jobPosition']);

        return [
            'id' => $employee->id,
            'employee_code' => $employee->employee_code,
            'first_name' => $employee->first_name,
            'last_name' => $employee->last_name,
            'full_name' => trim("{$employee->first_name} {$employee->last_name}"),
            'department' => $employee->department?->name,
            'job_position' => $employee->jobPosition?->name,
            'photo_url' => is_string($employee->photo) && $employee->photo !== ''
                ? '/storage/'.ltrim($employee->photo, '/')
                : null,
        ];
    }
}
