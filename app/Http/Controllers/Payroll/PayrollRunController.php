<?php

namespace App\Http\Controllers\Payroll;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Exceptions\PayrollWorkflowException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\CancelPayrollRunRequest;
use App\Http\Requests\Payroll\RecalculatePayrollRunRequest;
use App\Http\Requests\Payroll\RevertPayrollRunRequest;
use App\Http\Requests\Payroll\StorePayrollRunRequest;
use App\Models\PayrollPeriodVerification;
use App\Models\PayrollRun;
use App\Services\Payroll\PayrollCalculationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class PayrollRunController extends Controller
{
    public function index(): InertiaResponse
    {
        $runs = PayrollRun::query()
            ->with('periodVerification')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PayrollRun $run) => [
                'id' => $run->id,
                'status' => $run->status,
                'currency' => $run->currency,
                'total_gross' => $run->total_gross,
                'total_deductions' => $run->total_deductions,
                'total_net' => $run->total_net,
                'period_from' => $run->periodVerification?->period_from,
                'period_to' => $run->periodVerification?->period_to,
                'created_at' => $run->created_at->toDateTimeString(),
                'approved_at' => $run->approved_at?->toDateTimeString(),
                'paid_at' => $run->paid_at?->toDateTimeString(),
            ]);

        $verifiedPeriods = PayrollPeriodVerification::query()
            ->where('status', PayrollPeriodVerification::STATUS_VERIFIED)
            ->whereDoesntHave('payrollRuns')
            ->orderByDesc('period_from')
            ->get(['id', 'period_from', 'period_to']);

        return Inertia::render('payroll/runs/index', [
            'runs' => $runs,
            'verifiedPeriods' => $verifiedPeriods->map(fn ($p) => [
                'id' => $p->id,
                'period_from' => $p->period_from,
                'period_to' => $p->period_to,
            ]),
        ]);
    }

    public function store(StorePayrollRunRequest $request, PayrollCalculationService $calculationService): RedirectResponse
    {
        $validated = $request->validated();

        $verification = PayrollPeriodVerification::query()->findOrFail($validated['payroll_period_verification_id']);

        if (! $verification->isVerified()) {
            return redirect()->back()->with('error', 'Payroll runs can only be created for fully verified pay periods.');
        }

        try {
            $run = $calculationService->buildDraftRun($verification);
        } catch (PayrollWorkflowException $exception) {
            return redirect()->route('payroll.runs.index')->with('error', $exception->getMessage());
        }

        if (filled($validated['notes'] ?? null)) {
            $run->update(['notes' => $validated['notes']]);
        }

        return redirect()->route('payroll.runs.show', $run)
            ->with('success', 'Payroll run created. Review the calculations and approve when ready.');
    }

    public function show(PayrollRun $run): InertiaResponse
    {
        $run->loadMissing(['periodVerification', 'employees.employee', 'approver']);

        $employees = $run->employees->map(fn (\App\Models\PayrollRunEmployee $e) => [
            'id' => $e->id,
            'employee_id' => $e->employee_id,
            'employee_name' => $e->employee ? trim($e->employee->first_name.' '.$e->employee->last_name) : 'Employee #'.$e->employee_id,
            'basic_salary' => $e->basic_salary,
            'housing_allowance' => $e->housing_allowance,
            'transport_allowance' => $e->transport_allowance,
            'food_allowance' => $e->food_allowance,
            'other_allowance' => $e->other_allowance,
            'overtime_minutes' => $e->overtime_minutes,
            'overtime_amount' => $e->overtime_amount,
            'loan_deduction' => $e->loan_deduction,
            'other_deduction' => $e->other_deduction,
            'gross_salary' => $e->gross_salary,
            'total_deductions' => $e->total_deductions,
            'net_salary' => $e->net_salary,
        ]);

        $employeeCounts = $run->employees->countBy('employee_id');
        $duplicateEmployeeIds = $employeeCounts
            ->filter(fn (int $count) => $count > 1)
            ->keys()
            ->values()
            ->all();

        return Inertia::render('payroll/runs/show', [
            'run' => [
                'id' => $run->id,
                'status' => $run->status,
                'currency' => $run->currency,
                'total_gross' => $run->total_gross,
                'total_deductions' => $run->total_deductions,
                'total_net' => $run->total_net,
                'notes' => $run->notes,
                'period_from' => $run->periodVerification?->period_from,
                'period_to' => $run->periodVerification?->period_to,
                'approved_by_name' => $run->approver?->name,
                'approved_at' => $run->approved_at?->toDateTimeString(),
                'paid_at' => $run->paid_at?->toDateTimeString(),
            ],
            'employees' => $employees,
            'duplicateEmployeeIds' => $duplicateEmployeeIds,
            'hasDuplicateEmployees' => $duplicateEmployeeIds !== [],
        ]);
    }

    public function approve(Request $request, PayrollRun $run, PayrollCalculationService $calculationService): RedirectResponse
    {
        if (! $request->user()->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::Update)) {
            abort(403);
        }

        if (! in_array($run->status, [PayrollRun::STATUS_DRAFT, PayrollRun::STATUS_REVIEW], true)) {
            return redirect()->back()->with('error', 'Only draft or review-stage runs can be approved.');
        }

        try {
            $calculationService->approveRun($run, $request->user()->id);
        } catch (PayrollWorkflowException $exception) {
            return redirect()->route('payroll.runs.show', $run)->with('error', $exception->getMessage());
        }

        return redirect()->route('payroll.runs.show', $run)
            ->with('success', 'Payroll run approved.');
    }

    public function markPaid(Request $request, PayrollRun $run, PayrollCalculationService $calculationService): RedirectResponse
    {
        if (! $request->user()->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::Update)) {
            abort(403);
        }

        if ($run->status !== PayrollRun::STATUS_APPROVED) {
            return redirect()->back()->with('error', 'Only approved runs can be marked as paid.');
        }

        try {
            $calculationService->markPaid($run);
        } catch (PayrollWorkflowException $exception) {
            return redirect()->route('payroll.runs.show', $run)->with('error', $exception->getMessage());
        }

        return redirect()->route('payroll.runs.show', $run)
            ->with('success', 'Payroll run marked as paid. Payslips are now available to employees.');
    }

    public function recalculate(
        RecalculatePayrollRunRequest $request,
        PayrollRun $run,
        PayrollCalculationService $calculationService,
    ): RedirectResponse {
        try {
            $calculationService->recalculateRun($run);
        } catch (PayrollWorkflowException $exception) {
            return redirect()->route('payroll.runs.show', $run)->with('error', $exception->getMessage());
        }

        return redirect()->route('payroll.runs.show', $run)
            ->with('success', 'Payroll figures refreshed from current employee compensation.');
    }

    public function revert(
        RevertPayrollRunRequest $request,
        PayrollRun $run,
        PayrollCalculationService $calculationService,
    ): RedirectResponse {
        try {
            if ($run->isPaid()) {
                $calculationService->revertPaid($run);
                $message = 'Payroll run reverted to approved. You can adjust figures or undo approval before marking paid again.';
            } else {
                $calculationService->revertApproval($run);
                $message = 'Payroll run reverted to draft. Review figures and approve again when ready.';
            }
        } catch (PayrollWorkflowException $exception) {
            return redirect()->route('payroll.runs.show', $run)->with('error', $exception->getMessage());
        }

        return redirect()->route('payroll.runs.show', $run)->with('success', $message);
    }

    public function destroy(
        CancelPayrollRunRequest $request,
        PayrollRun $run,
        PayrollCalculationService $calculationService,
    ): RedirectResponse {
        try {
            $calculationService->cancelRun($run);
        } catch (PayrollWorkflowException $exception) {
            return redirect()->route('payroll.runs.show', $run)->with('error', $exception->getMessage());
        }

        return redirect()->route('payroll.runs.index')
            ->with('success', 'Payroll run cancelled. You can create a new run for this period after re-verification if needed.');
    }
}
