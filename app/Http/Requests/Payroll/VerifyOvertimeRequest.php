<?php

namespace App\Http\Requests\Payroll;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use Illuminate\Foundation\Http\FormRequest;

class VerifyOvertimeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::Verify);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
