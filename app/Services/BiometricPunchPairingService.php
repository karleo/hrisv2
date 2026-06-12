<?php

namespace App\Services;

use App\Models\BiometricSetting;
use App\Models\Employee;
use App\Models\EmployeeTimeEntry;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class BiometricPunchPairingService
{
    public function __construct(
        private readonly AttendanceClassificationService $attendanceClassificationService
    ) {}

    /**
     * @param  list<array{log_id: string, employee_identifier: string, punched_at: CarbonImmutable, event: string}>  $punches
     * @return array{processed: int, skipped: int}
     */
    public function applyPunches(BiometricSetting $settings, array $punches): array
    {
        $processed = 0;
        $skipped = 0;

        foreach ($punches as $punch) {
            $employee = $this->resolveEmployee($settings, $punch['employee_identifier']);
            if ($employee === null) {
                $skipped++;

                continue;
            }

            $handled = DB::transaction(function () use ($settings, $employee, $punch): bool {
                $punchAt = $punch['punched_at']->setTimezone(config('app.timezone'));
                $duplicateWindow = max(0, $settings->duplicate_window_seconds);
                $maxPairingSeconds = max(1, $settings->max_pairing_hours) * 3600;

                $duplicateExists = EmployeeTimeEntry::query()
                    ->where('employee_id', $employee->id)
                    ->where(function ($query) use ($punchAt, $duplicateWindow): void {
                        $query->whereBetween('clock_in_at', [
                            $punchAt->subSeconds($duplicateWindow),
                            $punchAt->addSeconds($duplicateWindow),
                        ])->orWhereBetween('clock_out_at', [
                            $punchAt->subSeconds($duplicateWindow),
                            $punchAt->addSeconds($duplicateWindow),
                        ]);
                    })
                    ->exists();

                if ($duplicateExists) {
                    return false;
                }

                $openEntry = EmployeeTimeEntry::query()
                    ->where('employee_id', $employee->id)
                    ->whereNull('clock_out_at')
                    ->latest('clock_in_at')
                    ->first();

                if ($openEntry === null) {
                    $entry = EmployeeTimeEntry::query()->create([
                        'employee_id' => $employee->id,
                        'clock_in_at' => $punchAt,
                    ]);
                    $entry->recalculateAttendanceStatuses($this->attendanceClassificationService);
                    $entry->save();

                    return true;
                }

                $diffSeconds = $openEntry->clock_in_at->diffInSeconds($punchAt, false);
                if ($diffSeconds <= 0) {
                    return false;
                }

                if ($diffSeconds > $maxPairingSeconds) {
                    if (! $settings->treat_single_punch_as_open_entry) {
                        return false;
                    }

                    $entry = EmployeeTimeEntry::query()->create([
                        'employee_id' => $employee->id,
                        'clock_in_at' => $punchAt,
                    ]);
                    $entry->recalculateAttendanceStatuses($this->attendanceClassificationService);
                    $entry->save();

                    return true;
                }

                $openEntry->clock_out_at = $punchAt;
                $openEntry->recalculateAttendanceStatuses($this->attendanceClassificationService);
                $openEntry->save();

                return true;
            });

            if ($handled) {
                $processed++;
            } else {
                $skipped++;
            }
        }

        return [
            'processed' => $processed,
            'skipped' => $skipped,
        ];
    }

    private function resolveEmployee(BiometricSetting $settings, string $identifier): ?Employee
    {
        $identifier = trim($identifier);
        if ($identifier === '') {
            return null;
        }

        if ($settings->employee_identifier_field === 'id') {
            if (! ctype_digit($identifier)) {
                return null;
            }

            return Employee::query()->find((int) $identifier);
        }

        return Employee::query()->where('employee_code', $identifier)->first();
    }
}
