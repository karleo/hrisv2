<?php

namespace App\Http\Requests\EmployeeTimeEntry;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CheckOutEmployeeTimeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        if ($user->isAdministrator()) {
            return false;
        }

        return $user->employee !== null
            && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::View);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'daily_summary' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
