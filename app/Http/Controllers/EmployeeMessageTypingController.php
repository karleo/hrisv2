<?php

namespace App\Http\Controllers;

use App\Events\EmployeeMessageTyping;
use App\Http\Requests\EmployeeMessage\TypingEmployeeMessageRequest;
use App\Models\Employee;
use App\Models\EmployeeConversation;
use Illuminate\Http\JsonResponse;

class EmployeeMessageTypingController extends Controller
{
    public function store(TypingEmployeeMessageRequest $request): JsonResponse
    {
        $user = $request->user();
        $employee = $user?->employee;

        if (! $employee instanceof Employee || ! $user?->isAccountActive()) {
            abort(403);
        }

        $conversationId = (int) $request->integer('conversation_id');
        $conversation = EmployeeConversation::query()
            ->forEmployee($employee->id)
            ->whereKey($conversationId)
            ->firstOrFail();

        $recipientEmployeeId = $conversation->otherEmployeeId($employee->id);

        broadcast(new EmployeeMessageTyping(
            conversationId: $conversation->id,
            recipientEmployeeId: $recipientEmployeeId,
            employee: [
                'id' => $employee->id,
                'full_name' => trim("{$employee->first_name} {$employee->last_name}"),
            ],
            isTyping: $request->boolean('is_typing'),
        ))->toOthers();

        return response()->json(['ok' => true]);
    }
}
