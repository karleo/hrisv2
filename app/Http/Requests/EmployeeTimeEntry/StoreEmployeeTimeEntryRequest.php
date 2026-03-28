<?php

namespace App\Http\Requests\EmployeeTimeEntry;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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

        return $user->employee !== null
            && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::View);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        if ($this->user()?->isAdministrator()) {
            return [
                'employee_id' => ['required', 'integer', 'exists:employees,id'],
            ];
        }

        return [];
    }
}
