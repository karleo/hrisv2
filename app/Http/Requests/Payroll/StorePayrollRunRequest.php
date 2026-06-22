<?php

namespace App\Http\Requests\Payroll;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use Illuminate\Foundation\Http\FormRequest;

class StorePayrollRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::Create);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'payroll_period_verification_id' => ['required', 'integer', 'exists:payroll_period_verifications,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
