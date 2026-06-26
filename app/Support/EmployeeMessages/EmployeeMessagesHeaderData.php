<?php

namespace App\Support\EmployeeMessages;

use App\Models\Employee;
use App\Models\EmployeeConversation;
use App\Models\EmployeeMessage;
use App\Support\PublicStorageUrl;
use Illuminate\Database\Eloquent\Builder;

class EmployeeMessagesHeaderData
{
    /**
     * @return array{unread_count:int,conversations:array<int,array<string,mixed>>}
     */
    public function forEmployee(Employee $employee, int $limit = 8): array
    {
        $conversations = EmployeeConversation::query()
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
            ->having('unread_messages_count', '>', 0)
            ->orderByDesc('last_message_at')
            ->limit($limit)
            ->get()
            ->map(fn (EmployeeConversation $conversation) => $this->conversationPayload($conversation, $employee))
            ->values();

        return [
            'unread_count' => (int) $conversations->sum(fn (array $conversation) => (int) ($conversation['unread_count'] ?? 0)),
            'conversations' => $conversations->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function conversationPayload(EmployeeConversation $conversation, Employee $viewer): array
    {
        $conversation->loadMissing([
            'employeeOne.department',
            'employeeOne.jobPosition',
            'employeeTwo.department',
            'employeeTwo.jobPosition',
            'lastMessage',
        ]);

        $other = $conversation->employee_one_id === $viewer->id
            ? $conversation->employeeTwo
            : $conversation->employeeOne;

        $unreadCount = (int) ($conversation->getAttribute('unread_messages_count') ?? 0);

        return [
            'id' => $conversation->id,
            'employee' => $this->employeePayload($other),
            'last_message' => $conversation->lastMessage
                ? $this->messagePayload($conversation->lastMessage)
                : null,
            'last_message_at' => $conversation->last_message_at?->toIso8601String(),
            'unread_count' => $unreadCount,
        ];
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
                ? PublicStorageUrl::forPath($path)
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
                ? PublicStorageUrl::forPath($employee->photo)
                : null,
        ];
    }
}
