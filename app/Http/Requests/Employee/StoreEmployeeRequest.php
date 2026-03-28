<?php

namespace App\Http\Requests\Employee;

use App\Models\Employee;
use App\Models\WorkTimetable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
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
            'contact_number' => ['nullable', 'string', 'max:50'],
            'address_1' => ['nullable', 'string', 'max:255'],
            'address_2' => ['nullable', 'string', 'max:255'],
            'company_profile_id' => ['nullable', 'integer', 'exists:company_profiles,id'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'job_position_id' => ['required', 'integer', 'exists:job_positions,id'],
            'work_timetable_id' => ['required', 'integer', 'exists:work_timetables,id'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'max:10240'],
            'document_labels' => ['nullable', 'array'],
            'document_labels.*' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $id = $this->input('work_timetable_id');
            if ($id === null) {
                return;
            }
            $timetable = WorkTimetable::query()->withCount('days')->find($id);
            if ($timetable !== null && $timetable->days_count !== 7) {
                $validator->errors()->add('work_timetable_id', 'The selected work timetable must have all seven weekdays defined.');
            }
        });
    }
}
