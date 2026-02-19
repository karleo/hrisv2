<?php

namespace App\Http\Requests\Employee;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreEmployeeRequest extends FormRequest
{
    public const ROLES = ['Employee', 'Manager', 'CEO'];

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'employee_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique(Employee::class),
            ],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email_address' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(Employee::class, 'email_address'),
            ],
            // Checkbox sends "on"; only validate when present (checked).
            'create_user' => ['sometimes', 'accepted'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'address_1' => ['nullable', 'string', 'max:255'],
            'address_2' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'company_address_1' => ['nullable', 'string', 'max:255'],
            'company_address_2' => ['nullable', 'string', 'max:255'],
            'company_website' => ['nullable', 'string', 'url', 'max:255'],
            'company_logo' => ['nullable', 'image', 'max:2048'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'job_position_id' => ['required', 'integer', 'exists:job_positions,id'],
            'role' => ['required', 'string', Rule::in(self::ROLES)],
            'photo' => ['nullable', 'image', 'max:5120'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'max:10240'],
            'document_labels' => ['nullable', 'array'],
            'document_labels.*' => ['nullable', 'string', 'max:255'],
        ];

        if ($this->boolean('create_user')) {
            $rules['email_address'][] = Rule::unique(User::class, 'email');
            $rules['user_password'] = [
                'required',
                'string',
                Password::defaults(),
                'confirmed',
            ];
        }

        return $rules;
    }
}
