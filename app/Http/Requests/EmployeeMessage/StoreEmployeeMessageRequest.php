<?php

namespace App\Http\Requests\EmployeeMessage;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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
            'body' => ['nullable', 'string', 'max:4000'],
            'client_message_id' => ['nullable', 'string', 'max:80'],
            'attachment' => [
                'nullable',
                'file',
                'max:10240',
                'mimes:pdf,jpeg,jpg,png,gif,webp,doc,docx,xls,xlsx,csv,txt,zip',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $body = trim((string) $this->input('body', ''));
            if ($body === '' && ! $this->hasFile('attachment')) {
                $validator->errors()->add(
                    'body',
                    'Please enter a message or attach a file.',
                );
            }
        });
    }
}
