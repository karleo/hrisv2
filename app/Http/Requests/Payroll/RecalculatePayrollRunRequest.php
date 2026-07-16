<?php

namespace App\Http\Requests\Payroll;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use Illuminate\Foundation\Http\FormRequest;

class RecalculatePayrollRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->isAdministrator()
            || $user->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::Update);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
