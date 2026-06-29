<?php

namespace App\Http\Requests\EmployeeTimeEntry;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\EmployeeTimeEntry;
use App\Support\AttendanceEntryAuthorization;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateEmployeeTimeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        /** @var EmployeeTimeEntry|null $entry */
        $entry = $this->route('employee_time_entry');

        if ($user === null || $entry === null) {
            return false;
        }

        $auth = app(AttendanceEntryAuthorization::class);

        if ($auth->canManageForOthers($user)) {
            return $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::Update);
        }

        if ($auth->canModifyOvertime($user) && $this->isOvertimeOnlyUpdate()) {
            return true;
        }

        if (! $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::Update)) {
            return false;
        }

        if (! $user->employee || $entry->employee_id !== $user->employee->id) {
            return false;
        }

        return $entry->clock_out_at === null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $auth = app(AttendanceEntryAuthorization::class);

        if ($auth->canManageForOthers($this->user())) {
            return [
                'clock_in_at' => ['sometimes', 'date'],
                'clock_out_at' => ['sometimes', 'nullable', 'date'],
                'daily_summary' => ['nullable', 'string', 'max:5000'],
                'overtime_minutes' => ['sometimes', 'integer', 'min:0', 'max:1440'],
            ];
        }

        if ($auth->canModifyOvertime($this->user()) && $this->isOvertimeOnlyUpdate()) {
            return [
                'overtime_minutes' => ['required', 'integer', 'min:0', 'max:1440'],
            ];
        }

        return [
            'clock_out_at' => ['nullable', 'date'],
            'daily_summary' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var EmployeeTimeEntry|null $entry */
            $entry = $this->route('employee_time_entry');

            if ($entry === null || $this->isOvertimeOnlyUpdate()) {
                return;
            }

            $clockIn = $this->has('clock_in_at')
                ? $this->date('clock_in_at')
                : $entry->clock_in_at;

            $clockOut = $this->has('clock_out_at')
                ? $this->date('clock_out_at')
                : $entry->clock_out_at;

            if ($clockOut !== null && $clockOut->lte($clockIn)) {
                $validator->errors()->add('clock_out_at', 'Check-out must be after check-in.');
            }
        });
    }

    private function isOvertimeOnlyUpdate(): bool
    {
        return $this->has('overtime_minutes')
            && ! $this->has('clock_in_at')
            && ! $this->has('clock_out_at')
            && ! $this->has('daily_summary');
    }
}
