<?php

namespace App\Http\Requests\Employee;

use App\Models\DocumentType;
use App\Models\Employee;
use App\Models\WorkTimetable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    private const EMPLOYEE_STATUSES = [
        'Employed',
        'Active',
        'On Probation',
        'Resigned',
        'Serving Notice Period',
        'Terminated',
        'Absconded',
        'Suspended',
        'Employment Cancelled',
    ];

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
            'biometric_user_id' => [
                'nullable',
                'string',
                'max:24',
                'regex:/^\d+$/',
                Rule::unique(Employee::class, 'biometric_user_id'),
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
            'contact_number' => ['required', 'string', 'max:50'],
            'address_1' => ['nullable', 'string', 'max:255'],
            'address_2' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'regex:/^[0-9+\-\s()]+$/', 'max:50'],
            'mobile' => ['nullable', 'regex:/^[0-9+\-\s()]+$/', 'max:50'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'in:Male,Female'],
            'marital_status' => ['nullable', 'in:Single,Married,Other'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'regex:/^[0-9+\-\s()]+$/', 'max:50'],
            'company_profile_id' => ['nullable', 'integer', 'exists:company_profiles,id'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'job_position_id' => ['required', 'integer', 'exists:job_positions,id'],
            'work_timetable_id' => ['required', 'integer', 'exists:work_timetables,id'],
            'joining_date' => ['nullable', 'date'],
            'first_contract_date' => ['nullable', 'date'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'employee_status' => ['nullable', 'string', Rule::in(self::EMPLOYEE_STATUSES)],
            'leave_opening_balance' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'max:10240'],
            'document_type_ids' => ['nullable', 'array'],
            'document_type_ids.*' => ['nullable', 'integer', 'exists:document_types,id'],
            'document_expiry_dates' => ['nullable', 'array'],
            'document_expiry_dates.*' => ['nullable', 'date'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $id = $this->input('work_timetable_id');
            if ($id === null) {
                // keep checking document type rules below
            } else {
                $timetable = WorkTimetable::query()->withCount('days')->find($id);
                if ($timetable !== null && $timetable->days_count !== 7) {
                    $validator->errors()->add('work_timetable_id', 'The selected work timetable must have all seven weekdays defined.');
                }
            }

            $documentTypeIds = $this->input('document_type_ids', []);
            $documentExpiryDates = $this->input('document_expiry_dates', []);
            foreach ($documentTypeIds as $index => $documentTypeId) {
                if (! filled($documentTypeId)) {
                    continue;
                }

                $documentType = DocumentType::query()->find($documentTypeId);
                if ($documentType === null || ! $documentType->is_active) {
                    $validator->errors()->add("document_type_ids.$index", 'Please select an active document type.');

                    continue;
                }

                if ($documentType->requires_expiry_date && ! filled($documentExpiryDates[$index] ?? null)) {
                    $validator->errors()->add("document_expiry_dates.$index", 'Expiry date is required for the selected document type.');
                }
            }
        });
    }
}
