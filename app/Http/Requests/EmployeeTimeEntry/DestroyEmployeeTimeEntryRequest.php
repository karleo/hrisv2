<?php

namespace App\Http\Requests\EmployeeTimeEntry;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\EmployeeTimeEntry;
use Illuminate\Foundation\Http\FormRequest;

class DestroyEmployeeTimeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        /** @var EmployeeTimeEntry|null $entry */
        $entry = $this->route('employee_time_entry');

        if ($user === null || $entry === null || ! $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::Delete)) {
            return false;
        }

        return $user->isAdministrator();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [];
    }
}
