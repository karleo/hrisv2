<?php

namespace App\Http\Requests\Payroll;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Requests\Payroll\Concerns\ValidatesEmployeeCompensationLineItems;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeCompensationRequest extends FormRequest
{
    use ValidatesEmployeeCompensationLineItems;

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
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:8'],
            'pay_frequency' => ['required', 'string', 'in:monthly,biweekly,weekly'],
            ...$this->lineItemRules(),
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_account_number' => ['nullable', 'string', 'max:64'],
            'iban' => ['nullable', 'string', 'max:34'],
            'effective_from' => ['nullable', 'date', 'date_format:Y-m-d'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $this->validateLineItems($validator);
    }
}
