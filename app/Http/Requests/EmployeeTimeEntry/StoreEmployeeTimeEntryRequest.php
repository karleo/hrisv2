<?php

namespace App\Http\Requests\EmployeeTimeEntry;

use App\Enums\AttendanceWorkMode;
use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Support\AttendanceEntryAuthorization;
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

        $auth = app(AttendanceEntryAuthorization::class);

        if ($this->filled('employee_id')) {
            return $auth->canManageForOthers($user)
                && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::CheckIn);
        }

        if ($auth->canManageForOthers($user)) {
            return $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::CheckIn);
        }

        return $user->employee !== null
            && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::View);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $auth = app(AttendanceEntryAuthorization::class);

        if ($auth->canManageForOthers($user) && $this->filled('employee_id')) {
            return [
                'employee_id' => ['required', 'integer', 'exists:employees,id'],
                'work_mode' => ['nullable', Rule::enum(AttendanceWorkMode::class)],
                'clock_in_at' => ['nullable', 'date'],
                'clock_out_at' => ['nullable', 'date', 'after:clock_in_at'],
            ];
        }

        if ($auth->canManageForOthers($user) && $user?->employee !== null) {
            // Manager self-check-in uses employee rules below
        } elseif ($auth->canManageForOthers($user)) {
            return [
                'employee_id' => ['required', 'integer', 'exists:employees,id'],
                'work_mode' => ['nullable', Rule::enum(AttendanceWorkMode::class)],
                'clock_in_at' => ['nullable', 'date'],
                'clock_out_at' => ['nullable', 'date', 'after:clock_in_at'],
            ];
        }

        $workMode = AttendanceWorkMode::tryFrom((string) $this->input('work_mode', ''));
        $isField = $workMode?->isField() ?? false;

        return [
            'work_mode' => ['required', Rule::enum(AttendanceWorkMode::class)],
            'check_in_remarks' => ['nullable', 'string', 'max:2000'],
            'check_in_photo' => [
                $isField ? 'required' : 'nullable',
                'image',
                'mimes:jpeg,jpg,png',
                'max:3072',
            ],
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
