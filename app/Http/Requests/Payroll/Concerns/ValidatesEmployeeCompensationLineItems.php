<?php

namespace App\Http\Requests\Payroll\Concerns;

use App\Enums\PayDeductionBehavior;
use App\Models\EmployeeCompensation;
use App\Models\PayAllowanceType;
use App\Models\PayDeductionType;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\Rule;

trait ValidatesEmployeeCompensationLineItems
{
    /**
     * @return array<string, mixed>
     */
    protected function lineItemRules(): array
    {
        return [
            'allowances' => ['nullable', 'array'],
            'allowances.*.pay_allowance_type_id' => [
                'required',
                'integer',
                Rule::exists(PayAllowanceType::class, 'id')->where('is_active', true),
            ],
            'allowances.*.amount' => ['required', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'array'],
            'deductions.*.pay_deduction_type_id' => [
                'required',
                'integer',
                Rule::exists(PayDeductionType::class, 'id')->where('is_active', true),
            ],
            'deductions.*.amount' => ['required', 'numeric', 'min:0'],
            'deductions.*.principal_amount' => ['nullable', 'numeric', 'min:0'],
            'deductions.*.remaining_balance' => ['nullable', 'numeric', 'min:0'],
            'overtime_rate_multiplier' => ['nullable', 'numeric', 'min:1', 'max:3'],
            'overtime_rate_basis' => ['nullable', 'string', 'in:'.implode(',', [
                EmployeeCompensation::OVERTIME_BASIS_PER_HOUR,
                EmployeeCompensation::OVERTIME_BASIS_PER_30_MINUTES,
                EmployeeCompensation::OVERTIME_BASIS_PER_15_MINUTES,
                EmployeeCompensation::OVERTIME_BASIS_PER_MINUTE,
            ])],
            'overtime_standard_monthly_hours' => ['nullable', 'numeric', 'min:1', 'max:400'],
        ];
    }

    protected function validateLineItems(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $deductions = $this->input('deductions', []);

            if (! is_array($deductions) || $deductions === []) {
                return;
            }

            $typeIds = collect($deductions)
                ->pluck('pay_deduction_type_id')
                ->filter()
                ->unique()
                ->values();

            $typesById = PayDeductionType::query()
                ->whereIn('id', $typeIds)
                ->get()
                ->keyBy('id');

            $loanCount = 0;
            $cashAdvanceCount = 0;

            foreach ($deductions as $index => $deduction) {
                $typeId = $deduction['pay_deduction_type_id'] ?? null;
                $type = $typesById->get($typeId);

                if ($type === null) {
                    continue;
                }

                if ($type->behavior === PayDeductionBehavior::Loan) {
                    $loanCount++;
                }

                if ($type->behavior === PayDeductionBehavior::CashAdvance) {
                    $cashAdvanceCount++;
                }

                if (! $type->behavior->requiresPrincipal()) {
                    continue;
                }

                $principal = (float) ($deduction['principal_amount'] ?? 0);
                $installment = (float) ($deduction['amount'] ?? 0);

                if ($principal <= 0) {
                    $validator->errors()->add(
                        "deductions.{$index}.principal_amount",
                        'Principal amount is required for loan and cash advance deductions.',
                    );
                }

                if ($installment <= 0) {
                    $validator->errors()->add(
                        "deductions.{$index}.amount",
                        'Monthly recovery amount must be greater than zero.',
                    );
                }

                if ($principal > 0 && $installment > $principal) {
                    $validator->errors()->add(
                        "deductions.{$index}.amount",
                        'Monthly recovery cannot exceed the principal amount.',
                    );
                }
            }

            if ($loanCount > 1) {
                $validator->errors()->add('deductions', 'Only one active loan deduction is allowed per employee.');
            }

            if ($cashAdvanceCount > 1) {
                $validator->errors()->add('deductions', 'Only one active cash advance deduction is allowed per employee.');
            }
        });
    }
}
