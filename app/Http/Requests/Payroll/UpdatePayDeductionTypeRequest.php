<?php

namespace App\Http\Requests\Payroll;

use App\Enums\ModuleAbility;
use App\Enums\PayDeductionBehavior;
use App\Enums\PermissionModule;
use App\Models\PayDeductionType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePayDeductionTypeRequest extends FormRequest
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
        /** @var PayDeductionType $payDeductionType */
        $payDeductionType = $this->route('pay_deduction_type');

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique(PayDeductionType::class)->ignore($payDeductionType->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'behavior' => ['required', 'string', Rule::enum(PayDeductionBehavior::class)],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ];
    }
}
