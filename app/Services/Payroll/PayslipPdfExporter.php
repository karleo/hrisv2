<?php

namespace App\Services\Payroll;

use App\Models\CompanyProfile;
use App\Models\PayrollRun;
use App\Models\PayrollRunEmployee;
use App\Support\PublicStorageUrl;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

final class PayslipPdfExporter
{
    public function downloadForEmployee(PayrollRun $run, PayrollRunEmployee $runEmployee): HttpResponse
    {
        $runEmployee->loadMissing(['employee.companyProfile', 'employee.department']);

        $employee = $runEmployee->employee;
        $employeeName = $employee ? trim($employee->first_name.' '.$employee->last_name) : 'Employee #'.$runEmployee->employee_id;
        $employeeCode = $employee?->employee_code ?? $employee?->biometric_device_pin;
        $department = $employee?->department?->name;

        $company = $employee?->companyProfile ?? CompanyProfile::query()->orderBy('id')->first(['id', 'company_name', 'logo']);
        $companyName = $company?->company_name ?? 'Company';

        $companyLogoDataUri = PublicStorageUrl::dataUriForPath($company?->logo);

        $run->loadMissing('periodVerification');
        $periodFrom = $run->periodVerification?->period_from ?? '—';
        $periodTo = $run->periodVerification?->period_to ?? '—';

        $overtimeHours = round($runEmployee->overtime_minutes / 60, 1);

        $pdf = Pdf::loadView('payroll.payslip-pdf', [
            'companyName' => $companyName,
            'companyLogoDataUri' => $companyLogoDataUri,
            'employeeName' => $employeeName,
            'employeeCode' => $employeeCode,
            'department' => $department,
            'currency' => $run->currency,
            'periodFrom' => $periodFrom,
            'periodTo' => $periodTo,
            'generatedAt' => now()->format('d M Y H:i'),
            'basicSalary' => $runEmployee->basic_salary,
            'housingAllowance' => $runEmployee->housing_allowance,
            'transportAllowance' => $runEmployee->transport_allowance,
            'foodAllowance' => $runEmployee->food_allowance,
            'otherAllowance' => $runEmployee->other_allowance,
            'overtimeAmount' => $runEmployee->overtime_amount,
            'overtimeHours' => $overtimeHours,
            'overtimeMultiplier' => $runEmployee->overtime_rate_multiplier,
            'loanDeduction' => $runEmployee->loan_deduction,
            'otherDeduction' => $runEmployee->other_deduction,
            'grossSalary' => $runEmployee->gross_salary,
            'totalDeductions' => $runEmployee->total_deductions,
            'netSalary' => $runEmployee->net_salary,
        ])->setPaper('a4', 'portrait');

        $safeName = preg_replace('/[^a-z0-9]+/i', '-', strtolower($employeeName));
        $filename = "payslip-{$safeName}-{$periodFrom}-{$periodTo}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Download the payroll register for all employees in a run as PDF.
     */
    public function downloadRegister(PayrollRun $run): HttpResponse
    {
        $run->loadMissing(['periodVerification', 'employees.employee.department']);

        $company = CompanyProfile::query()->orderBy('id')->first(['id', 'company_name', 'logo']);
        $companyName = $company?->company_name ?? 'Company';

        $companyLogoDataUri = PublicStorageUrl::dataUriForPath($company?->logo);

        $periodFrom = $run->periodVerification?->period_from ?? '—';
        $periodTo = $run->periodVerification?->period_to ?? '—';

        $rows = $run->employees->map(fn (\App\Models\PayrollRunEmployee $e) => [
            'employee_name' => $e->employee ? trim($e->employee->first_name.' '.$e->employee->last_name) : 'Employee #'.$e->employee_id,
            'department' => $e->employee?->department?->name,
            'basic_salary' => $e->basic_salary,
            'housing_allowance' => $e->housing_allowance,
            'transport_allowance' => $e->transport_allowance,
            'food_allowance' => $e->food_allowance,
            'other_allowance' => $e->other_allowance,
            'overtime_amount' => $e->overtime_amount,
            'gross_salary' => $e->gross_salary,
            'total_deductions' => $e->total_deductions,
            'net_salary' => $e->net_salary,
        ])->all();

        $pdf = Pdf::loadView('payroll.register-pdf', [
            'companyName' => $companyName,
            'companyLogoDataUri' => $companyLogoDataUri,
            'currency' => $run->currency,
            'periodFrom' => $periodFrom,
            'periodTo' => $periodTo,
            'generatedAt' => now()->format('d M Y H:i'),
            'totalGross' => $run->total_gross,
            'totalDeductions' => $run->total_deductions,
            'totalNet' => $run->total_net,
            'rows' => $rows,
        ])->setPaper('a4', 'landscape');

        $filename = "payroll-register-{$periodFrom}-{$periodTo}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Stream a payroll register as CSV.
     */
    public function downloadRegisterCsv(PayrollRun $run): HttpResponse
    {
        $run->loadMissing(['periodVerification', 'employees.employee.department']);

        $periodFrom = $run->periodVerification?->period_from ?? '—';
        $periodTo = $run->periodVerification?->period_to ?? '—';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"payroll-register-{$periodFrom}-{$periodTo}.csv\"",
        ];

        $callback = function () use ($run): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Employee',
                'Department',
                'Basic Salary',
                'Housing',
                'Transport',
                'Food',
                'Other Allowance',
                'Overtime',
                'Gross Salary',
                'Deductions',
                'Net Salary',
                'Currency',
            ]);

            foreach ($run->employees as $e) {
                fputcsv($handle, [
                    $e->employee ? trim($e->employee->first_name.' '.$e->employee->last_name) : 'Employee #'.$e->employee_id,
                    $e->employee?->department?->name ?? '—',
                    $e->basic_salary,
                    $e->housing_allowance,
                    $e->transport_allowance,
                    $e->food_allowance,
                    $e->other_allowance,
                    $e->overtime_amount,
                    $e->gross_salary,
                    $e->total_deductions,
                    $e->net_salary,
                    $run->currency,
                ]);
            }

            fclose($handle);
        };

        return response()->streamDownload($callback, "payroll-register-{$periodFrom}-{$periodTo}.csv", $headers);
    }
}
