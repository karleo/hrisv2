<?php

namespace App\Http\Requests\EmployeeTimeEntry;

use App\Enums\AttendanceWorkMode;
use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeTimeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        if ($user->isAdministrator()) {
            return $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::CheckIn);
        }

        // Regular employees: must have a linked employee and time attendance view permission
        return $user->employee !== null
            && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::View);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();

        // Administrator checking in FOR ANOTHER employee (employee_id provided)
        if ($user?->isAdministrator() && $this->filled('employee_id')) {
            return [
                'employee_id' => ['required', 'integer', 'exists:employees,id'],
                'work_mode' => ['nullable', Rule::enum(AttendanceWorkMode::class)],
            ];
        }

        // Administrator self-check-in (no employee_id, but has linked employee)
        // Falls through to the regular employee rules below
        if ($user?->isAdministrator() && $user->employee !== null) {
            // Same as regular employee — work_mode required with optional evidence
        } elseif ($user?->isAdministrator()) {
            // Admin without linked employee must supply employee_id
            return [
                'employee_id' => ['required', 'integer', 'exists:employees,id'],
                'work_mode' => ['nullable', Rule::enum(AttendanceWorkMode::class)],
            ];
        }

        // For regular employees, work_mode is required and drives evidence requirements
        $workMode = AttendanceWorkMode::tryFrom((string) $this->input('work_mode', ''));
        $isField = $workMode?->isField() ?? false;

        return [
            'work_mode' => ['required', Rule::enum(AttendanceWorkMode::class)],
            'check_in_remarks' => ['nullable', 'string', 'max:2000'],

            // Photo: required for field modes, optional for WFH (max 3 MB)
            'check_in_photo' => [
                $isField ? 'required' : 'nullable',
                'image',
                'mimes:jpeg,jpg,png',
                'max:3072',
            ],

            // GPS: required for field modes, optional for WFH
            'check_in_latitude' => [
                $isField ? 'required' : 'nullable',
                'numeric',
                'between:-90,90',
            ],
            'check_in_longitude' => [
                $isField ? 'required' : 'nullable',
                'numeric',
                'between:-180,180',
            ],
        ];
    }
}
