<?php

namespace App\Http\Controllers\Payroll;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Models\PayrollRun;
use App\Models\PayrollRunEmployee;
use App\Services\Payroll\PayslipPdfExporter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class PayslipController extends Controller
{
    /**
     * Employee self-view: list payslips (paid runs that contain the authenticated employee).
     */
    public function myPayslips(Request $request): InertiaResponse
    {
        $user = $request->user();
        $employeeId = $user?->employee?->id;

        $payslips = [];

        if ($employeeId !== null) {
            $payslips = PayrollRunEmployee::query()
                ->with('payrollRun.periodVerification')
                ->where('employee_id', $employeeId)
                ->whereHas('payrollRun', fn ($q) => $q->where('status', PayrollRun::STATUS_PAID))
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (PayrollRunEmployee $e) => [
                    'id' => $e->id,
                    'run_id' => $e->payroll_run_id,
                    'period_from' => $e->payrollRun?->periodVerification?->period_from,
                    'period_to' => $e->payrollRun?->periodVerification?->period_to,
                    'currency' => $e->payrollRun?->currency ?? 'AED',
                    'gross_salary' => $e->gross_salary,
                    'total_deductions' => $e->total_deductions,
                    'net_salary' => $e->net_salary,
                    'paid_at' => $e->payrollRun?->paid_at?->toDateTimeString(),
                ])
                ->all();
        }

        return Inertia::render('payroll/my-payslips', [
            'payslips' => $payslips,
        ]);
    }

    /**
     * Download an individual payslip PDF.
     * Accessible by: the employee themselves, or payroll managers.
     */
    public function downloadPayslip(Request $request, PayrollRun $run, PayrollRunEmployee $runEmployee, PayslipPdfExporter $exporter): HttpResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        $isOwnPayslip = $user->employee?->id === $runEmployee->employee_id;
        $canManagePayroll = $user->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::View);

        if (! $isOwnPayslip && ! $canManagePayroll) {
            abort(403);
        }

        if ($runEmployee->payroll_run_id !== $run->id) {
            abort(404);
        }

        if (! $isOwnPayslip && $run->status !== PayrollRun::STATUS_PAID && ! $canManagePayroll) {
            abort(403);
        }

        if ($isOwnPayslip && $run->status !== PayrollRun::STATUS_PAID) {
            abort(403, 'Payslip not available until the run is marked as paid.');
        }

        return $exporter->downloadForEmployee($run, $runEmployee);
    }

    /**
     * Download the full payroll register as PDF.
     */
    public function downloadRegister(Request $request, PayrollRun $run, PayslipPdfExporter $exporter): HttpResponse
    {
        if (! $request->user()->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::View)) {
            abort(403);
        }

        return $exporter->downloadRegister($run);
    }

    /**
     * Download the full payroll register as CSV.
     */
    public function downloadRegisterCsv(Request $request, PayrollRun $run, PayslipPdfExporter $exporter): HttpResponse
    {
        if (! $request->user()->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::View)) {
            abort(403);
        }

        return $exporter->downloadRegisterCsv($run);
    }
}
