<?php

namespace App\Http\Requests\Payroll;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\PayAllowanceType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePayAllowanceTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::Update);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var PayAllowanceType $payAllowanceType */
        $payAllowanceType = $this->route('pay_allowance_type');

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique(PayAllowanceType::class)->ignore($payAllowanceType->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ];
    }
}
