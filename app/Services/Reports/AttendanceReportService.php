<?php

namespace App\Services\Reports;

use App\Enums\BiometricPunchDirection;
use App\Models\BiometricPunch;
use App\Models\Employee;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

final class AttendanceReportService
{
    private const int DUPLICATE_PUNCH_WINDOW_SECONDS = 180;

    private const int MINIMUM_CHECKOUT_GAP_MINUTES = 5;

    /**
     * @return array{
     *     rows: list<array{
     *         date: string,
     *         employee_id: int|null,
     *         employee_name: string,
     *         employee_code: string|null,
     *         device_pin: string,
     *         device_name: string|null,
     *         clock_in: string|null,
     *         clock_out: string|null,
     *         punch_count: int,
     *         working_hours: string,
     *         working_minutes: int|null,
     *     }>,
     *     total_punches: int,
     * }
     */
    public function build(
        string $from,
        string $to,
        ?int $employeeId = null,
        ?int $biometricDeviceId = null,
    ): array {
        $query = BiometricPunch::query()
            ->with(['employee:id,first_name,last_name,employee_code', 'device:id,name'])
            ->where('punched_at', '>=', $from.' 00:00:00')
            ->where('punched_at', '<=', $to.' 23:59:59')
            ->orderBy('punched_at');

        if ($employeeId !== null) {
            $query->where('employee_id', $employeeId);
        }

        if ($biometricDeviceId !== null) {
            $query->where('biometric_device_id', $biometricDeviceId);
        }

        $punches = $query->get();

        $rows = $this->aggregateDailyRows($punches);

        return [
            'rows' => $rows,
            'total_punches' => $punches->count(),
        ];
    }

    /**
     * Attendance for an employee mapped on a biometric device (by employee link or device PIN).
     *
     * @return array{
     *     rows: list<array{
     *         date: string,
     *         employee_id: int|null,
     *         employee_name: string,
     *         employee_code: string|null,
     *         device_pin: string,
     *         device_name: string|null,
     *         clock_in: string|null,
     *         clock_out: string|null,
     *         punch_count: int,
     *         working_hours: string,
     *         working_minutes: int|null,
     *     }>,
     *     total_punches: int,
     * }
     */
    public function buildForEmployee(
        Employee $employee,
        string $from,
        string $to,
        ?int $biometricDeviceId = null,
    ): array {
        $pin = trim((string) $employee->biometric_user_id);

        if ($pin === '') {
            return [
                'rows' => [],
                'total_punches' => 0,
            ];
        }

        $pins = [$pin];

        if (ctype_digit($pin)) {
            $normalized = ltrim($pin, '0') ?: '0';

            if (! in_array($normalized, $pins, true)) {
                $pins[] = $normalized;
            }
        }

        $query = BiometricPunch::query()
            ->with(['employee:id,first_name,last_name,employee_code', 'device:id,name'])
            ->where('punched_at', '>=', $from.' 00:00:00')
            ->where('punched_at', '<=', $to.' 23:59:59')
            ->where(function ($builder) use ($employee, $pins): void {
                $builder->where('employee_id', $employee->id)
                    ->orWhereIn('device_user_id', $pins);
            })
            ->orderBy('punched_at');

        if ($biometricDeviceId !== null) {
            $query->where('biometric_device_id', $biometricDeviceId);
        }

        $punches = $query->get();

        $rows = $this->aggregateDailyRows($punches);

        return [
            'rows' => $rows,
            'total_punches' => $punches->count(),
        ];
    }

    /**
     * @param  Collection<int, BiometricPunch>  $punches
     * @return list<array{
     *     date: string,
     *     employee_id: int|null,
     *     employee_name: string,
     *     employee_code: string|null,
     *     device_pin: string,
     *     device_name: string|null,
     *     clock_in: string|null,
     *     clock_out: string|null,
     *     punch_count: int,
     * }>
     */
    private function aggregateDailyRows(Collection $punches): array
    {
        /** @var array<string, array{punches: list<BiometricPunch>, employee_id: int|null, device_pin: string, device_name: string|null, employee_name: string, employee_code: string|null, date: string}> $groups */
        $groups = [];

        foreach ($punches as $punch) {
            $date = $this->dateFromPunch($punch);
            $employeeId = $punch->employee_id;
            $groupKey = ($employeeId !== null ? 'e:'.$employeeId : 'p:'.$punch->device_user_id).':'.$date;

            if (! isset($groups[$groupKey])) {
                $groups[$groupKey] = [
                    'date' => $date,
                    'employee_id' => $employeeId,
                    'device_pin' => $punch->device_user_id,
                    'device_name' => $punch->device?->name,
                    'employee_name' => $punch->employee
                        ? trim($punch->employee->first_name.' '.$punch->employee->last_name)
                        : 'Unmapped (PIN '.$punch->device_user_id.')',
                    'employee_code' => $punch->employee?->employee_code,
                    'punches' => [],
                ];
            }

            $groups[$groupKey]['punches'][] = $punch;
        }

        $rows = [];

        foreach ($groups as $group) {
            $dayPunches = $group['punches'];
            [$clockIn, $clockOut] = $this->resolveClockTimes($dayPunches);

            [$workingHours, $workingMinutes] = $this->workingDuration(
                $group['date'],
                $clockIn,
                $clockOut,
            );

            $rows[] = [
                'date' => $group['date'],
                'employee_id' => $group['employee_id'],
                'employee_name' => $group['employee_name'],
                'employee_code' => $group['employee_code'],
                'device_pin' => $group['device_pin'],
                'device_name' => $group['device_name'],
                'clock_in' => $clockIn,
                'clock_out' => $clockOut,
                'punch_count' => count($dayPunches),
                'working_hours' => $workingHours,
                'working_minutes' => $workingMinutes,
            ];
        }

        usort($rows, function (array $a, array $b): int {
            $dateCompare = strcmp($a['date'], $b['date']);

            if ($dateCompare !== 0) {
                return $dateCompare;
            }

            return strcmp($a['employee_name'], $b['employee_name']);
        });

        return $rows;
    }

    /**
     * @param  list<BiometricPunch>  $dayPunches  Chronologically ordered punches for one employee/PIN and date.
     * @return array{0: string|null, 1: string|null}
     */
    private function resolveClockTimes(array $dayPunches): array
    {
        if ($dayPunches === []) {
            return [null, null];
        }

        $dayPunches = $this->dedupeConsecutivePunches($dayPunches);

        if (count($dayPunches) === 1) {
            $time = $this->timeFromPunch($dayPunches[0]);

            return match ($dayPunches[0]->direction) {
                BiometricPunchDirection::In => [$time, null],
                BiometricPunchDirection::Out => [null, $time],
            };
        }

        $inTimes = [];
        $outTimes = [];

        foreach ($dayPunches as $punch) {
            $time = $this->timeFromPunch($punch);

            if ($punch->direction === BiometricPunchDirection::In) {
                $inTimes[] = $time;
            }

            if ($punch->direction === BiometricPunchDirection::Out) {
                $outTimes[] = $time;
            }
        }

        $clockIn = $inTimes !== [] ? min($inTimes) : $this->timeFromPunch($dayPunches[0]);
        $clockOut = $outTimes !== [] ? max($outTimes) : $this->timeFromPunch($dayPunches[count($dayPunches) - 1]);

        if ($clockIn !== null && $clockOut !== null && $this->minutesBetweenTimes($clockIn, $clockOut) < self::MINIMUM_CHECKOUT_GAP_MINUTES) {
            $clockOut = null;
        }

        return [$clockIn, $clockOut];
    }

    /**
     * Collapse rapid duplicate check-ins or check-outs from the device (same direction within a short window).
     *
     * @param  list<BiometricPunch>  $dayPunches
     * @return list<BiometricPunch>
     */
    private function dedupeConsecutivePunches(array $dayPunches): array
    {
        if (count($dayPunches) <= 1) {
            return $dayPunches;
        }

        /** @var list<BiometricPunch> $deduped */
        $deduped = [$dayPunches[0]];

        for ($index = 1; $index < count($dayPunches); $index++) {
            $previous = $deduped[count($deduped) - 1];
            $current = $dayPunches[$index];

            if ($current->direction !== $previous->direction) {
                $deduped[] = $current;

                continue;
            }

            if ($this->secondsBetweenPunches($previous, $current) >= self::DUPLICATE_PUNCH_WINDOW_SECONDS) {
                $deduped[] = $current;

                continue;
            }

            if ($current->direction === BiometricPunchDirection::Out) {
                $deduped[count($deduped) - 1] = $current;
            }
        }

        return $deduped;
    }

    private function secondsBetweenPunches(BiometricPunch $earlier, BiometricPunch $later): int
    {
        return max(0, (int) $earlier->punched_at->diffInSeconds($later->punched_at));
    }

    private function minutesBetweenTimes(string $startTime, string $endTime): int
    {
        try {
            $start = Carbon::parse('2000-01-01 '.$startTime);
            $end = Carbon::parse('2000-01-01 '.$endTime);

            if ($end->lessThanOrEqualTo($start)) {
                return 0;
            }

            return (int) $start->diffInMinutes($end);
        } catch (\Throwable) {
            return 0;
        }
    }

    private function dateFromPunch(BiometricPunch $punch): string
    {
        $raw = $punch->getRawOriginal('punched_at');

        if (is_string($raw) && strlen($raw) >= 10) {
            return substr($raw, 0, 10);
        }

        return $punch->punched_at->format('Y-m-d');
    }

    private function timeFromPunch(BiometricPunch $punch): string
    {
        $raw = $punch->getRawOriginal('punched_at');

        if (is_string($raw) && strlen($raw) >= 19) {
            return substr($raw, 11, 8);
        }

        return $punch->punched_at->format('H:i:s');
    }

    /**
     * @return array{0: string, 1: int|null}
     */
    private function workingDuration(string $date, ?string $clockIn, ?string $clockOut): array
    {
        if ($clockIn === null || $clockOut === null) {
            return ['—', null];
        }

        try {
            $start = Carbon::parse($date.' '.$clockIn);
            $end = Carbon::parse($date.' '.$clockOut);

            if ($end->lessThanOrEqualTo($start)) {
                $end = $end->copy()->addDay();
            }

            $minutes = (int) $start->diffInMinutes($end);

            return [$this->formatWorkingMinutes($minutes), $minutes];
        } catch (\Throwable) {
            return ['—', null];
        }
    }

    private function formatWorkingMinutes(int $minutes): string
    {
        if ($minutes <= 0) {
            return '0m';
        }

        $hours = intdiv($minutes, 60);
        $remainder = $minutes % 60;

        if ($hours === 0) {
            return $remainder.'m';
        }

        if ($remainder === 0) {
            return $hours.'h';
        }

        return $hours.'h '.$remainder.'m';
    }
}
