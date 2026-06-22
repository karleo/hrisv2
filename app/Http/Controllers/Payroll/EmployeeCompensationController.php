<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreEmployeeCompensationRequest;
use App\Http\Requests\Payroll\UpdateEmployeeCompensationRequest;
use App\Models\Employee;
use App\Models\EmployeeCompensation;
use App\Models\EmployeeCompensationItem;
use App\Models\PayAllowanceType;
use App\Models\PayDeductionType;
use App\Support\CompanyAccessScope;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EmployeeCompensationController extends Controller
{
    public function __construct(
        private readonly CompanyAccessScope $companyScope,
    ) {}

    public function show(Employee $employee): InertiaResponse
    {
        $employee->loadMissing('compensation.items.allowanceType', 'compensation.items.deductionType');

        $compensation = $employee->compensation;

        return Inertia::render('payroll/compensation/show', [
            'employee' => [
                'id' => $employee->id,
                'name' => trim($employee->first_name.' '.$employee->last_name),
                'employee_code' => $employee->employee_code,
            ],
            'compensation' => $compensation ? $this->compensationPayload($compensation) : null,
            'allowanceTypes' => PayAllowanceType::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'description'])
                ->all(),
            'deductionTypes' => PayDeductionType::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'description', 'behavior'])
                ->all(),
        ]);
    }

    public function store(StoreEmployeeCompensationRequest $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validated();

        $compensation = EmployeeCompensation::query()->create([
            'employee_id' => $employee->id,
            'basic_salary' => $validated['basic_salary'],
            'currency' => $validated['currency'],
            'pay_frequency' => $validated['pay_frequency'],
            'overtime_rate_multiplier' => $validated['overtime_rate_multiplier'] ?? 1.25,
            'overtime_rate_basis' => $validated['overtime_rate_basis'] ?? EmployeeCompensation::OVERTIME_BASIS_PER_HOUR,
            'overtime_standard_monthly_hours' => $validated['overtime_standard_monthly_hours'] ?? 176,
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_account_number' => $validated['bank_account_number'] ?? null,
            'iban' => $validated['iban'] ?? null,
            'effective_from' => $validated['effective_from'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->syncItems($compensation, $validated);
        $compensation->syncLegacyAggregateColumns();
        $compensation->save();

        return redirect()->route('payroll.compensation.show', $employee)
            ->with('success', 'Compensation record saved successfully.');
    }

    public function update(UpdateEmployeeCompensationRequest $request, Employee $employee, EmployeeCompensation $compensation): RedirectResponse
    {
        $validated = $request->validated();

        $compensation->update([
            'basic_salary' => $validated['basic_salary'],
            'currency' => $validated['currency'],
            'pay_frequency' => $validated['pay_frequency'],
            'overtime_rate_multiplier' => $validated['overtime_rate_multiplier'] ?? 1.25,
            'overtime_rate_basis' => $validated['overtime_rate_basis'] ?? EmployeeCompensation::OVERTIME_BASIS_PER_HOUR,
            'overtime_standard_monthly_hours' => $validated['overtime_standard_monthly_hours'] ?? 176,
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_account_number' => $validated['bank_account_number'] ?? null,
            'iban' => $validated['iban'] ?? null,
            'effective_from' => $validated['effective_from'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->syncItems($compensation, $validated);
        $compensation->syncLegacyAggregateColumns();
        $compensation->save();

        return redirect()->route('payroll.compensation.show', $employee)
            ->with('success', 'Compensation updated successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function compensationPayload(EmployeeCompensation $compensation): array
    {
        $compensation->loadMissing('items.allowanceType', 'items.deductionType');

        return [
            'id' => $compensation->id,
            'basic_salary' => $compensation->basic_salary,
            'currency' => $compensation->currency,
            'pay_frequency' => $compensation->pay_frequency,
            'allowances' => $compensation->items
                ->where('type', EmployeeCompensationItem::TYPE_ALLOWANCE)
                ->values()
                ->map(fn (EmployeeCompensationItem $item) => [
                    'id' => $item->id,
                    'pay_allowance_type_id' => $item->pay_allowance_type_id,
                    'name' => $item->name,
                    'amount' => $item->amount,
                ])
                ->all(),
            'deductions' => $compensation->items
                ->where('type', EmployeeCompensationItem::TYPE_DEDUCTION)
                ->values()
                ->map(fn (EmployeeCompensationItem $item) => [
                    'id' => $item->id,
                    'pay_deduction_type_id' => $item->pay_deduction_type_id,
                    'name' => $item->name,
                    'amount' => $item->amount,
                    'principal_amount' => $item->principal_amount,
                    'remaining_balance' => $item->remaining_balance,
                    'behavior' => $item->deductionType?->behavior?->value,
                ])
                ->all(),
            'overtime_rate_multiplier' => $compensation->overtime_rate_multiplier,
            'overtime_rate_basis' => $compensation->overtime_rate_basis,
            'overtime_standard_monthly_hours' => $compensation->overtime_standard_monthly_hours,
            'overtime_rate_per_basis' => $compensation->overtimeRatePerBasis(),
            'bank_name' => $compensation->bank_name,
            'bank_account_number' => $compensation->bank_account_number,
            'iban' => $compensation->iban,
            'effective_from' => $compensation->effective_from,
            'notes' => $compensation->notes,
            'gross_salary' => $compensation->grossSalary(),
            'total_deductions' => $compensation->totalDeductions(),
            'net_salary' => $compensation->netSalary(),
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function syncItems(EmployeeCompensation $compensation, array $validated): void
    {
        $compensation->items()->delete();

        $allowanceTypes = PayAllowanceType::query()
            ->whereIn('id', collect($validated['allowances'] ?? [])->pluck('pay_allowance_type_id')->filter())
            ->get()
            ->keyBy('id');

        $deductionTypes = PayDeductionType::query()
            ->whereIn('id', collect($validated['deductions'] ?? [])->pluck('pay_deduction_type_id')->filter())
            ->get()
            ->keyBy('id');

        $sortOrder = 0;

        foreach ($validated['allowances'] ?? [] as $allowance) {
            $typeId = $allowance['pay_allowance_type_id'] ?? null;
            $type = $allowanceTypes->get($typeId);

            if ($type === null) {
                continue;
            }

            $compensation->items()->create([
                'type' => EmployeeCompensationItem::TYPE_ALLOWANCE,
                'pay_allowance_type_id' => $type->id,
                'name' => $type->name,
                'amount' => $allowance['amount'] ?? 0,
                'sort_order' => $sortOrder++,
            ]);
        }

        $sortOrder = 0;

        foreach ($validated['deductions'] ?? [] as $deduction) {
            $typeId = $deduction['pay_deduction_type_id'] ?? null;
            $type = $deductionTypes->get($typeId);

            if ($type === null) {
                continue;
            }

            $principal = $type->requiresPrincipal()
                ? (float) ($deduction['principal_amount'] ?? 0)
                : null;

            $remaining = $type->requiresPrincipal()
                ? (float) ($deduction['remaining_balance'] ?? $principal)
                : null;

            $compensation->items()->create([
                'type' => EmployeeCompensationItem::TYPE_DEDUCTION,
                'pay_deduction_type_id' => $type->id,
                'name' => $type->name,
                'amount' => $deduction['amount'] ?? 0,
                'principal_amount' => $principal,
                'remaining_balance' => $remaining,
                'sort_order' => $sortOrder++,
            ]);
        }
    }
}
