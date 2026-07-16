<?php

namespace App\Services;

use App\Enums\AttendanceWorkMode;
use App\Models\BiometricAttendanceSession;
use App\Models\Employee;
use App\Models\EmployeeTimeEntry;
use App\Services\Reports\AttendanceReportService;
use Illuminate\Support\Carbon;

final class EmployeeAttendanceStateService
{
    public function __construct(
        private readonly AttendanceReportService $attendanceReportService,
    ) {}

    public function findOpenWebEntry(Employee $employee): ?EmployeeTimeEntry
    {
        return EmployeeTimeEntry::query()
            ->where('employee_id', $employee->id)
            ->whereNull('clock_out_at')
            ->latest('clock_in_at')
            ->first();
    }

    public function findOpenBiometricSession(Employee $employee): ?BiometricAttendanceSession
    {
        return BiometricAttendanceSession::query()
            ->where('employee_id', $employee->id)
            ->where('is_open', true)
            ->latest('clock_in_at')
            ->first();
    }

    public function hasOpenAttendance(Employee $employee): bool
    {
        return $this->resolveOpenAttendance($employee) !== null;
    }

    /**
     * @return array{
     *     source: 'manual'|'biometric',
     *     id: int|null,
     *     biometric_session_id: int|null,
     *     clock_in_at: string,
     *     work_mode: string|null,
     *     work_mode_label: string,
     *     requires_field_evidence: bool,
     * }|null
     */
    public function resolveOpenAttendance(Employee $employee): ?array
    {
        $webEntry = $this->findOpenWebEntry($employee);

        if ($webEntry !== null) {
            return $this->formatWebOpenEntry($webEntry);
        }

        $biometricSession = $this->findOpenBiometricSession($employee);

        if ($biometricSession !== null) {
            return $this->formatBiometricOpenEntry($biometricSession);
        }

        $todayClockIn = $this->attendanceReportService->openBiometricClockInForEmployeeOnDate(
            $employee,
            Carbon::today(),
        );

        if ($todayClockIn === null) {
            return null;
        }

        return [
            'source' => 'biometric',
            'id' => null,
            'biometric_session_id' => null,
            'clock_in_at' => $todayClockIn->toIso8601String(),
            'work_mode' => null,
            'work_mode_label' => 'Biometric device',
            'requires_field_evidence' => false,
        ];
    }

    /**
     * Complete a manual web check-out for the employee's current open attendance.
     *
     * @param  array<string, mixed>  $checkoutData
     */
    public function completeCheckout(Employee $employee, array $checkoutData): EmployeeTimeEntry
    {
        $webEntry = $this->findOpenWebEntry($employee);

        if ($webEntry !== null) {
            return $webEntry;
        }

        $biometricSession = $this->findOpenBiometricSession($employee);
        $clockInAt = $biometricSession?->clock_in_at
            ?? $this->attendanceReportService->openBiometricClockInForEmployeeOnDate(
                $employee,
                Carbon::today(),
            );

        if ($clockInAt === null) {
            throw new \RuntimeException('No open check-in to complete.');
        }

        $clockOutAt = now();

        $entry = EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => $clockInAt,
            'clock_out_at' => $clockOutAt,
            'daily_summary' => $this->nullableTrimmedString($checkoutData['daily_summary'] ?? null),
            'check_out_remarks' => $this->nullableTrimmedString($checkoutData['check_out_remarks'] ?? null),
            'check_out_latitude' => $checkoutData['check_out_latitude'] ?? null,
            'check_out_longitude' => $checkoutData['check_out_longitude'] ?? null,
            'work_mode' => AttendanceWorkMode::WorkFromHome->value,
        ]);

        if ($biometricSession !== null) {
            $biometricSession->update([
                'clock_out_at' => $clockOutAt,
                'is_open' => false,
                'working_minutes' => max(0, $biometricSession->clock_in_at->diffInMinutes($clockOutAt)),
            ]);
        }

        return $entry;
    }

    public function openEntryRequiresFieldEvidence(Employee $employee): bool
    {
        $openAttendance = $this->resolveOpenAttendance($employee);

        return $openAttendance !== null
            && $openAttendance['source'] === 'manual'
            && $openAttendance['requires_field_evidence'];
    }

    /**
     * @return array{
     *     source: 'manual',
     *     id: int,
     *     biometric_session_id: null,
     *     clock_in_at: string,
     *     work_mode: string|null,
     *     work_mode_label: string,
     *     requires_field_evidence: bool,
     * }
     */
    private function formatWebOpenEntry(EmployeeTimeEntry $entry): array
    {
        return [
            'source' => 'manual',
            'id' => $entry->id,
            'biometric_session_id' => null,
            'clock_in_at' => $entry->clock_in_at->toIso8601String(),
            'work_mode' => $entry->work_mode?->value,
            'work_mode_label' => $entry->workModeLabel(),
            'requires_field_evidence' => $entry->requiresFieldEvidence(),
        ];
    }

    /**
     * @return array{
     *     source: 'biometric',
     *     id: null,
     *     biometric_session_id: int,
     *     clock_in_at: string,
     *     work_mode: null,
     *     work_mode_label: string,
     *     requires_field_evidence: false,
     * }
     */
    private function formatBiometricOpenEntry(BiometricAttendanceSession $session): array
    {
        return [
            'source' => 'biometric',
            'id' => null,
            'biometric_session_id' => $session->id,
            'clock_in_at' => $session->clock_in_at->toIso8601String(),
            'work_mode' => null,
            'work_mode_label' => 'Biometric device',
            'requires_field_evidence' => false,
        ];
    }

    private function nullableTrimmedString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
