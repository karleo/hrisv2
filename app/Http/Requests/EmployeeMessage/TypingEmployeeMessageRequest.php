<?php

namespace App\Http\Requests\EmployeeMessage;

use Illuminate\Foundation\Http\FormRequest;

class TypingEmployeeMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->employee !== null;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'conversation_id' => ['required', 'integer', 'exists:employee_conversations,id'],
            'is_typing' => ['required', 'boolean'],
        ];
    }
}
