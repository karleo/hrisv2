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
        $employee = $request->user()?->employee;

        if (! $employee instanceof Employee) {
            abort(403);
        }

        $conversation = EmployeeConversation::query()->findOrFail((int) $request->integer('conversation_id'));

        if (! in_array($employee->id, [$conversation->employee_one_id, $conversation->employee_two_id], true)) {
            abort(404);
        }

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
