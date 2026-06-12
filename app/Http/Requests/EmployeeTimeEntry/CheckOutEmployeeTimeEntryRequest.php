<?php

namespace App\Http\Requests\EmployeeTimeEntry;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\EmployeeTimeEntry;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CheckOutEmployeeTimeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        // Admins with a linked employee can use self-service checkout.
        if ($user->isAdministrator()) {
            return $user->employee !== null
                && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::CheckOut);
        }

        return $user->employee !== null
            && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::View);
    }

    /**
     * Add after-validation hook to branch evidence rules based on the open entry's work mode.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            // No additional conditional checks needed here; withValidator is a hook point
        });
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Determine if the open entry requires field evidence
        $isField = $this->openEntryRequiresFieldEvidence();

        return [
            'daily_summary' => ['nullable', 'string', 'max:5000'],
            'check_out_remarks' => ['nullable', 'string', 'max:2000'],

            // Photo: required when checking out from a field-mode entry
            'check_out_photo' => [
                $isField ? 'required' : 'nullable',
                'image',
                'mimes:jpeg,jpg,png',
                'max:3072',
            ],

            // GPS: required when checking out from a field-mode entry
            'check_out_latitude' => [
                $isField ? 'required' : 'nullable',
                'numeric',
                'between:-90,90',
            ],
            'check_out_longitude' => [
                $isField ? 'required' : 'nullable',
                'numeric',
                'between:-180,180',
            ],
        ];
    }

    /**
     * Look up the employee's current open entry to determine if field evidence is needed.
     */
    private function openEntryRequiresFieldEvidence(): bool
    {
        $user = $this->user();

        if ($user?->employee === null) {
            return false;
        }

        $entry = EmployeeTimeEntry::query()
            ->where('employee_id', $user->employee->id)
            ->whereNull('clock_out_at')
            ->latest('clock_in_at')
            ->first();

        return $entry?->requiresFieldEvidence() ?? false;
    }
}
