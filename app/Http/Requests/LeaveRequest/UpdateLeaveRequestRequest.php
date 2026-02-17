<?php

namespace App\Http\Requests\LeaveRequest;

use App\Models\Department;
use App\Models\Employee;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLeaveRequestRequest extends FormRequest
{
    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('details') && $this->input('details') === '') {
            $this->merge(['details' => null]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:'.Employee::class.',id'],
            'department_id' => ['required', 'integer', 'exists:'.Department::class.',id'],
            'absence_type' => ['required', 'string', 'in:Personal Leave,Sick Leave,Maternity Leave,Emergency Leave,Annual Leave,Others'],
            'absence_other' => ['nullable', 'string', 'max:255'],
            'details' => ['nullable', 'string', 'max:50', 'in:W/ medical Report,W/ Out medical Report'],
            'date' => ['nullable', 'date'],
            'period_from' => ['nullable', 'date'],
            'period_to' => ['nullable', 'date', 'after_or_equal:period_from'],
            'remarks' => ['nullable', 'string', 'max:65535'],
            'status' => ['sometimes', 'string', 'in:draft,submitted'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'period_to' => 'period end date',
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $type = $this->input('absence_type');

            if ($type === 'Others' && empty($this->input('absence_other'))) {
                $validator->errors()->add('absence_other', 'Please specify the other type of absence.');
            }
        });
    }
}
