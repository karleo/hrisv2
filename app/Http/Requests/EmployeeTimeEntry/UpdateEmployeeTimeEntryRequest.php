<?php

namespace App\Http\Requests\EmployeeTimeEntry;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\EmployeeTimeEntry;
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

        if ($user === null || $entry === null || ! $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::Update)) {
            return false;
        }

        if ($user->isAdministrator()) {
            return true;
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
        if ($this->user()?->isAdministrator()) {
            return [
                'clock_in_at' => ['sometimes', 'date'],
                'clock_out_at' => ['sometimes', 'nullable', 'date'],
                'daily_summary' => ['nullable', 'string', 'max:5000'],
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

            if ($entry === null) {
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
}
