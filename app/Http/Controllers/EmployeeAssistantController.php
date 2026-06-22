<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmployeeAssistant\StoreEmployeeAssistantMessageRequest;
use App\Models\Employee;
use App\Models\EmployeeAssistantConversation;
use App\Models\EmployeeAssistantMessage;
use App\Services\EmployeeAssistant\EmployeeAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class EmployeeAssistantController extends Controller
{
    public function __construct(
        private readonly EmployeeAssistantService $assistantService,
    ) {}

    public function index(Request $request): Response
    {
        $employee = $this->currentEmployee($request);
        $selectedConversationId = $request->integer('conversation');
        $selectedConversation = null;
        $messages = collect();

        if (is_int($selectedConversationId) && $selectedConversationId > 0) {
            $selectedConversation = EmployeeAssistantConversation::query()
                ->where('employee_id', $employee->id)
                ->whereKey($selectedConversationId)
                ->firstOrFail();

            $messages = $this->messagesPayload($selectedConversation);
        }

        return Inertia::render('employee-assistant/index', [
            'assistantEnabled' => $this->assistantService->resolvedSettings()['enabled'] ?? false,
            'assistantConfigured' => $this->assistantService->isConfigured(),
            'currentEmployee' => $this->employeePayload($employee),
            'conversations' => $this->conversationList($employee),
            'selectedConversation' => $selectedConversation instanceof EmployeeAssistantConversation
                ? $this->assistantService->conversationPayload($selectedConversation)
                : null,
            'messages' => $messages,
        ]);
    }

    public function storeMessage(StoreEmployeeAssistantMessageRequest $request): JsonResponse
    {
        $employee = $this->currentEmployee($request);

        $conversationId = $request->integer('conversation_id');
        if ($conversationId <= 0) {
            $conversationId = null;
        } else {
            EmployeeAssistantConversation::query()
                ->where('employee_id', $employee->id)
                ->whereKey($conversationId)
                ->firstOrFail();
        }

        try {
            $result = $this->assistantService->sendMessage(
                $request->user(),
                (string) $request->validated('content'),
                $conversationId,
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json($result, 201);
    }

    public function destroyConversation(Request $request, EmployeeAssistantConversation $conversation): JsonResponse
    {
        $employee = $this->currentEmployee($request);

        if ((int) $conversation->employee_id !== (int) $employee->id) {
            abort(404);
        }

        $conversation->delete();

        return response()->json(['deleted' => true]);
    }

    private function currentEmployee(Request $request): Employee
    {
        $employee = $request->user()?->employee;

        if (! $employee instanceof Employee || ! $request->user()?->isAccountActive()) {
            abort(403);
        }

        return $employee->loadMissing(['department', 'jobPosition']);
    }

    /**
     * @return list<array{id: int, title: string|null, updated_at: string}>
     */
    private function conversationList(Employee $employee): array
    {
        return EmployeeAssistantConversation::query()
            ->where('employee_id', $employee->id)
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get()
            ->map(fn (EmployeeAssistantConversation $conversation): array => $this->assistantService->conversationPayload($conversation))
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, role: string, content: string, created_at: string}>
     */
    private function messagesPayload(EmployeeAssistantConversation $conversation): array
    {
        return EmployeeAssistantMessage::query()
            ->where('conversation_id', $conversation->id)
            ->orderBy('created_at')
            ->orderBy('id')
            ->limit(100)
            ->get()
            ->map(fn (EmployeeAssistantMessage $message): array => $this->assistantService->messagePayload($message))
            ->values()
            ->all();
    }

    /**
     * @return array{
     *     id: int,
     *     employee_code: string,
     *     first_name: string,
     *     last_name: string,
     *     full_name: string,
     *     department: string|null,
     *     job_position: string|null,
     * }
     */
    private function employeePayload(Employee $employee): array
    {
        return [
            'id' => (int) $employee->id,
            'employee_code' => $employee->employee_code,
            'first_name' => $employee->first_name,
            'last_name' => $employee->last_name,
            'full_name' => trim($employee->first_name.' '.$employee->last_name),
            'department' => $employee->department?->name,
            'job_position' => $employee->jobPosition?->name,
        ];
    }
}
