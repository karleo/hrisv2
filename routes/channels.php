<?php

use App\Models\EmployeeConversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('employee.{employeeId}', function (User $user, int $employeeId): bool {
    return $user->employee?->id === $employeeId;
});

Broadcast::channel('employees.online', function (User $user): array|bool {
    $employee = $user->employee;

    if ($employee === null || ! $user->is_active) {
        return false;
    }

    return [
        'id' => $employee->id,
        'full_name' => trim("{$employee->first_name} {$employee->last_name}"),
    ];
});

Broadcast::channel('employee.conversation.{conversationId}', function (User $user, int $conversationId): bool {
    $employeeId = $user->employee?->id;

    if ($employeeId === null) {
        return false;
    }

    return EmployeeConversation::query()
        ->forEmployee($employeeId)
        ->whereKey($conversationId)
        ->exists();
});
