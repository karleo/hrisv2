<?php

namespace App\Http\Requests\EmployeeMessage;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeMessageRequest extends FormRequest
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
            'recipient_employee_id' => ['required', 'integer', 'exists:employees,id'],
            'body' => ['required', 'string', 'max:4000'],
            'client_message_id' => ['nullable', 'string', 'max:80'],
        ];
    }
}
