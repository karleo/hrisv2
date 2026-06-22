<?php

namespace App\Http\Requests\EmployeeAssistant;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeAssistantMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->employee !== null && $this->user()?->isAccountActive() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'integer', 'exists:employee_assistant_conversations,id'],
        ];
    }
}
