<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\EmployeeCompensation;
use App\Models\PayrollPeriodVerification;
use App\Models\PayrollRun;
use App\Models\PayrollRunEmployee;
use Illuminate\Support\Carbon;

final class PayrollCalculationService
{
    /**
     * Build a draft payroll run from a verified pay period.
     * Pulls all employees with compensation records and calculates gross/net.
     */
    public function buildDraftRun(PayrollPeriodVerification $verification): PayrollRun
    {
        $run = PayrollRun::query()->create([
            'company_profile_id' => $verification->company_profile_id,
            'payroll_period_verification_id' => $verification->id,
            'status' => PayrollRun::STATUS_DRAFT,
            'currency' => 'AED',
            'total_gross' => 0,
            'total_deductions' => 0,
            'total_net' => 0,
        ]);

        $employees = Employee::query()
            ->with(['compensation.items'])
            ->get();

        $totalGross = 0.0;
        $totalDeductions = 0.0;
        $totalNet = 0.0;

        foreach ($employees as $employee) {
            /** @var Employee $employee */
            $compensation = $employee->compensation;

            if (! $compensation instanceof EmployeeCompensation) {
                continue;
            }

            $runEmployee = $this->calculateEmployee($run, $employee, $compensation, $verification);

            $totalGross += $runEmployee->gross_salary;
            $totalDeductions += $runEmployee->total_deductions;
            $totalNet += $runEmployee->net_salary;
        }

        $run->update([
            'total_gross' => $totalGross,
            'total_deductions' => $totalDeductions,
            'total_net' => $totalNet,
        ]);

        return $run->fresh(['employees.employee']);
    }

    private function calculateEmployee(
        PayrollRun $run,
        Employee $employee,
        EmployeeCompensation $compensation,
        PayrollPeriodVerification $verification,
    ): PayrollRunEmployee {
        $overtimeMinutes = $this->sumOvertimeForEmployee($employee, $verification->period_from, $verification->period_to);

        $overtimeAmount = $compensation->calculateOvertimeAmount($overtimeMinutes);

        $compensation->loadMissing('items');
        $allowances = $compensation->items->where('type', \App\Models\EmployeeCompensationItem::TYPE_ALLOWANCE)->values();
        $deductions = $compensation->items->where('type', \App\Models\EmployeeCompensationItem::TYPE_DEDUCTION)->values();

        $grossSalary = $compensation->grossSalary() + $overtimeAmount;
        $totalDeductions = $compensation->totalDeductions();
        $netSalary = max(0.0, $grossSalary - $totalDeductions);

        return PayrollRunEmployee::query()->create([
            'payroll_run_id' => $run->id,
            'employee_id' => $employee->id,
            'employee_compensation_id' => $compensation->id,
            'basic_salary' => $compensation->basic_salary,
            'housing_allowance' => (float) ($allowances->get(0)?->amount ?? 0),
            'transport_allowance' => (float) ($allowances->get(1)?->amount ?? 0),
            'food_allowance' => (float) ($allowances->get(2)?->amount ?? 0),
            'other_allowance' => (float) $allowances->skip(3)->sum('amount'),
            'overtime_minutes' => $overtimeMinutes,
            'overtime_rate_multiplier' => $compensation->overtime_rate_multiplier,
            'overtime_amount' => $overtimeAmount,
            'loan_deduction' => (float) ($deductions->get(0)?->amount ?? 0),
            'other_deduction' => (float) $deductions->skip(1)->sum('amount'),
            'gross_salary' => $grossSalary,
            'total_deductions' => $totalDeductions,
            'net_salary' => $netSalary,
        ]);
    }

    private function sumOvertimeForEmployee(Employee $employee, string $periodFrom, string $periodTo): int
    {
        return (int) $employee->timeEntries()
            ->where('clock_in_at', '>=', $periodFrom.' 00:00:00')
            ->where('clock_in_at', '<=', $periodTo.' 23:59:59')
            ->whereNotNull('overtime_minutes')
            ->sum('overtime_minutes');
    }

    public function approveRun(PayrollRun $run, int $userId): void
    {
        $run->update([
            'status' => PayrollRun::STATUS_APPROVED,
            'approved_by' => $userId,
            'approved_at' => Carbon::now(),
        ]);
    }

    public function markPaid(PayrollRun $run): void
    {
        $run->update([
            'status' => PayrollRun::STATUS_PAID,
            'paid_at' => Carbon::now(),
        ]);
    }
}
