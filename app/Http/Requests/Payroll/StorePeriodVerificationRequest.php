<?php

namespace App\Http\Requests\Payroll;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use Illuminate\Foundation\Http\FormRequest;

class StorePeriodVerificationRequest extends FormRequest
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
            'period_from' => ['required', 'date', 'date_format:Y-m-d'],
            'period_to' => ['required', 'date', 'date_format:Y-m-d', 'after_or_equal:period_from'],
        ];
    }
}
