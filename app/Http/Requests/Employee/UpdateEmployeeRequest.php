<?php

namespace App\Http\Requests\Employee;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateEmployeeRequest extends FormRequest
{
    public const ROLES = ['Employee', 'Manager', 'CEO'];

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var \App\Models\Employee $employee */
        $employee = $this->route('employee');

        $rules = [
            'employee_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique(Employee::class)->ignore($employee->id),
            ],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email_address' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(Employee::class, 'email_address')->ignore($employee->id),
            ],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'address_1' => ['nullable', 'string', 'max:255'],
            'address_2' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'company_address_1' => ['nullable', 'string', 'max:255'],
            'company_address_2' => ['nullable', 'string', 'max:255'],
            'company_website' => ['nullable', 'string', 'url', 'max:255'],
            'company_logo' => ['nullable', 'image', 'max:2048'],
            'reset_user_password' => ['sometimes', 'accepted'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'job_position_id' => ['required', 'integer', 'exists:job_positions,id'],
            'role' => ['required', 'string', Rule::in(self::ROLES)],
            'photo' => ['nullable', 'image', 'max:5120'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'max:10240'],
            'document_labels' => ['nullable', 'array'],
            'document_labels.*' => ['nullable', 'string', 'max:255'],
        ];

        if ($this->boolean('reset_user_password') && $employee->user_id) {
            $rules['email_address'][] = Rule::unique(User::class, 'email')->ignore($employee->user_id);
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
