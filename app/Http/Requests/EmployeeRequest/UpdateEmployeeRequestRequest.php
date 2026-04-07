<?php

namespace App\Http\Requests\EmployeeRequest;

use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
            'job_position_id' => ['required', 'integer', 'exists:'.JobPosition::class.',id'],
            'department_id' => ['required', 'integer', 'exists:'.Department::class.',id'],
            'date' => ['required', 'date'],
            'date_of_joining' => ['required', 'date'],
            'departure_date' => ['nullable', 'date'],
            'arrival_date' => ['nullable', 'date', 'after_or_equal:departure_date'],
            'preferred_airlines' => ['nullable', 'string', 'max:100'],
            'last_encashment_date' => ['nullable', 'date'],
            'bag_allowance' => ['nullable', 'string', 'max:50'],
            'ticket_booking' => ['sometimes', 'boolean'],
            'passport_request' => ['sometimes', 'boolean'],
            'ticket_encashment' => ['sometimes', 'boolean'],
            'amount_2000' => ['sometimes', 'boolean', 'prohibited_if:amount_1000,1'],
            'amount_1000' => ['sometimes', 'boolean', 'prohibited_if:amount_2000,1'],
            'leave_salary' => ['nullable', 'string', 'max:255'],
            'passport_ack_airline_name' => ['nullable', 'string', 'max:255'],
            'passport_ack_home_country' => ['nullable', 'string', 'max:255'],
            'passport_ack_departure_date_time' => ['nullable', 'string', 'max:255'],
            'passport_ack_home_country_departure_date_time' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'in:draft,submitted'],
        ];
    }
}
