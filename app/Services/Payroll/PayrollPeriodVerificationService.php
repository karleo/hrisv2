<?php

namespace App\Services\Payroll;

use App\Exceptions\PayrollWorkflowException;
use App\Models\PayrollPeriodVerification;
use App\Models\PayrollRun;
use App\Models\User;
use App\Services\Reports\AttendanceReportService;
use Illuminate\Support\Carbon;

final class PayrollPeriodVerificationService
{
    public function __construct(
        private readonly AttendanceReportService $attendanceReportService,
    ) {}

    /**
     * @return array{
     *     total_employees: int,
     *     total_attendance_days: int,
     *     total_overtime_minutes: int,
     *     total_working_minutes: int,
     * }
     */
    public function buildSummary(string $from, string $to, ?User $viewer = null): array
    {
        $report = $this->attendanceReportService->build($from, $to, null, null, $viewer);
        $rows = $report['rows'];

        $employeeIds = array_filter(array_unique(array_column($rows, 'employee_id')));
        $totalOvertimeMinutes = array_sum(array_column($rows, 'overtime_minutes'));
        $totalWorkingMinutes = array_sum(array_column($rows, 'working_minutes'));

        return [
            'total_employees' => count($employeeIds),
            'total_attendance_days' => count($rows),
            'total_overtime_minutes' => (int) $totalOvertimeMinutes,
            'total_working_minutes' => (int) $totalWorkingMinutes,
        ];
    }

    public function verifyAttendance(
        PayrollPeriodVerification $verification,
        User $verifier,
        ?string $notes,
    ): void {
        $verification->update([
            'status' => PayrollPeriodVerification::STATUS_PENDING_FINANCE,
            'hr_verified_by' => $verifier->id,
            'hr_verified_at' => Carbon::now(),
            'hr_notes' => $notes,
        ]);
    }

    public function verifyOvertime(
        PayrollPeriodVerification $verification,
        User $verifier,
        ?string $notes,
    ): void {
        $verification->update([
            'status' => PayrollPeriodVerification::STATUS_VERIFIED,
            'finance_verified_by' => $verifier->id,
            'finance_verified_at' => Carbon::now(),
            'finance_notes' => $notes,
        ]);
    }

    public function reopen(PayrollPeriodVerification $verification): void
    {
        if ($verification->payrollRuns()->where('status', PayrollRun::STATUS_PAID)->exists()) {
            throw new PayrollWorkflowException(
                'Cannot reopen a period that has a completed (paid) payroll run. Undo the paid run first.',
            );
        }

        $verification->payrollRuns()
            ->whereIn('status', [
                PayrollRun::STATUS_DRAFT,
                PayrollRun::STATUS_REVIEW,
                PayrollRun::STATUS_APPROVED,
            ])
            ->each(fn (PayrollRun $run) => $run->delete());

        $verification->update([
            'status' => PayrollPeriodVerification::STATUS_REOPENED,
            'hr_verified_by' => null,
            'hr_verified_at' => null,
            'hr_notes' => null,
            'finance_verified_by' => null,
            'finance_verified_at' => null,
            'finance_notes' => null,
        ]);
    }

    public function destroy(PayrollPeriodVerification $verification): void
    {
        if ($verification->payrollRuns()->where('status', PayrollRun::STATUS_PAID)->exists()) {
            throw new PayrollWorkflowException(
                'Cannot delete a period that has a completed (paid) payroll run.',
            );
        }

        $verification->delete();
    }

    /**
     * @return array{
     *     total_runs: int,
     *     has_paid_run: bool,
     *     active_run_id: int|null,
     *     active_run_status: string|null,
     * }
     */
    public function payrollRunMeta(PayrollPeriodVerification $verification): array
    {
        $runs = $verification->payrollRuns()->orderByDesc('created_at')->get();
        $activeRun = $runs->first(fn (PayrollRun $run) => ! $run->isPaid());

        return [
            'total_runs' => $runs->count(),
            'has_paid_run' => $runs->contains(fn (PayrollRun $run) => $run->isPaid()),
            'active_run_id' => $activeRun?->id,
            'active_run_status' => $activeRun?->status,
        ];
    }
}
