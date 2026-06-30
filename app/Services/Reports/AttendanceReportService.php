<?php

namespace App\Services\Reports;

use App\Enums\BiometricPunchDirection;
use App\Models\BiometricPunch;
use App\Models\Employee;
use App\Models\EmployeeTimeEntry;
use App\Models\User;
use App\Support\CompanyAccessScope;
use App\Support\PublicStorageUrl;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

final class AttendanceReportService
{
    private const int DUPLICATE_PUNCH_WINDOW_SECONDS = 180;

    private const int MINIMUM_CHECKOUT_GAP_MINUTES = 5;

    public function __construct(private readonly CompanyAccessScope $companyScope) {}

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
     *         overtime: string,
     *         overtime_minutes: int|null,
     *         source: string,
     *         work_mode_label: string|null,
     *         check_in_remarks: string|null,
     *         check_out_remarks: string|null,
     *         check_in_photo_url: string|null,
     *         check_out_photo_url: string|null,
     *         check_in_latitude: float|null,
     *         check_in_longitude: float|null,
     *         check_out_latitude: float|null,
     *         check_out_longitude: float|null,
     *         time_entry_id: int|null,
     *         daily_summary: string|null,
     *         company_name: string|null,
     *     }>,
     *     total_punches: int,
     *     total_manual_entries: int,
     * }
     */
    public function build(
        string $from,
        string $to,
        ?int $employeeId = null,
        ?int $biometricDeviceId = null,
        ?User $viewer = null,
        ?int $companyProfileId = null,
        ?string $source = null,
    ): array {
        $query = BiometricPunch::query()
            ->with([
                'employee:id,first_name,last_name,employee_code,company_profile_id',
                'employee.companyProfile:id,company_name',
                'device:id,name',
            ])
            ->where('punched_at', '>=', $from.' 00:00:00')
            ->where('punched_at', '<=', $to.' 23:59:59')
            ->orderBy('punched_at');

        if ($viewer !== null) {
            $this->companyScope->scopeRelationViaEmployee($query, $viewer);
        }

        if ($companyProfileId !== null) {
            $query->whereHas('employee', fn ($builder) => $builder->where('company_profile_id', $companyProfileId));
        }

        if ($employeeId !== null) {
            $query->where('employee_id', $employeeId);
        }

        if ($biometricDeviceId !== null) {
            $query->where('biometric_device_id', $biometricDeviceId);
        }

        $punches = $query->get();
        $manualEntries = $this->manualEntriesQuery($from, $to, $employeeId, $viewer, $companyProfileId)->get();

        $rows = $this->aggregateDailyRows($punches, null, $manualEntries);

        if ($source !== null && $source !== '' && $source !== 'all') {
            $rows = array_values(array_filter(
                $rows,
                static fn (array $row): bool => ($row['source'] ?? '') === $source,
            ));
        }

        return [
            'rows' => $rows,
            'total_punches' => $punches->count(),
            'total_manual_entries' => $manualEntries->count(),
            'summary' => $this->summarizeRows($rows),
        ];
    }

    /**
     * @param  list<array{
     *     employee_id: int|null,
     *     working_minutes: int|null,
     *     overtime_minutes: int|null,
     *     punch_count: int,
     * }>  $rows
     * @return array{
     *     total_employees: int,
     *     total_days: int,
     *     total_working_minutes: int,
     *     total_overtime_minutes: int,
     *     total_punches: int,
     * }
     */
    public function summarizeRows(array $rows): array
    {
        $employeeIds = array_filter(array_unique(array_column($rows, 'employee_id')));

        return [
            'total_employees' => count($employeeIds),
            'total_days' => count($rows),
            'total_working_minutes' => (int) array_sum(array_map(
                static fn (array $row): int => (int) ($row['working_minutes'] ?? 0),
                $rows,
            )),
            'total_overtime_minutes' => (int) array_sum(array_map(
                static fn (array $row): int => (int) ($row['overtime_minutes'] ?? 0),
                $rows,
            )),
            'total_punches' => (int) array_sum(array_column($rows, 'punch_count')),
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
     *         overtime: string,
     *         overtime_minutes: int|null,
     *         source: string,
     *         work_mode_label: string|null,
     *         check_in_remarks: string|null,
     *         check_out_remarks: string|null,
     *         check_in_photo_url: string|null,
     *         check_out_photo_url: string|null,
     *         check_in_latitude: float|null,
     *         check_in_longitude: float|null,
     *         check_out_latitude: float|null,
     *         check_out_longitude: float|null,
     *         time_entry_id: int|null,
     *         daily_summary: string|null,
     *         company_name: string|null,
     *     }>,
     *     total_punches: int,
     *     total_manual_entries: int,
     * }
     */
    public function buildForEmployee(
        Employee $employee,
        string $from,
        string $to,
        ?int $biometricDeviceId = null,
    ): array {
        $punches = collect();
        $pin = trim((string) $employee->biometric_user_id);

        if ($pin !== '') {
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
        }

        $manualEntries = $this->manualEntriesQuery($from, $to, $employee->id, null)->get();
        $rows = $this->aggregateDailyRows($punches, $employee, $manualEntries);

        return [
            'rows' => $rows,
            'total_punches' => $punches->count(),
            'total_manual_entries' => $manualEntries->count(),
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
     *     working_hours: string,
     *     working_minutes: int|null,
     *     overtime: string,
     *     overtime_minutes: int|null,
     *     source: string,
     *     work_mode_label: string|null,
     * }>
     */
    private function aggregateDailyRows(
        Collection $punches,
        ?Employee $contextEmployee = null,
        ?Collection $manualEntries = null,
    ): array {
        $employeeMap = $this->employeesWithTimetables($punches, $contextEmployee, $manualEntries);

        /** @var array<string, array{
         *     punches: list<BiometricPunch>,
         *     employee_id: int|null,
         *     device_pin: string,
         *     device_name: string|null,
         *     employee_name: string,
         *     employee_code: string|null,
         *     date: string,
         *     manual_clock_ins: list<string>,
         *     manual_clock_outs: list<string>,
         *     work_mode_label: string|null,
         *     check_in_remarks: string|null,
         *     check_out_remarks: string|null,
         *     check_in_photo_url: string|null,
         *     check_out_photo_url: string|null,
         *     check_in_latitude: float|null,
         *     check_in_longitude: float|null,
         *     check_out_latitude: float|null,
         *     check_out_longitude: float|null,
         *     time_entry_id: int|null,
         *     daily_summary: string|null,
         *     company_name: string|null,
         * }> $groups */
        $groups = [];

        foreach ($punches as $punch) {
            $date = $this->dateFromPunch($punch);
            $employeeId = $punch->employee_id;
            $groupKey = ($employeeId !== null ? 'e:'.$employeeId : 'p:'.$punch->device_user_id).':'.$date;

            if (! isset($groups[$groupKey])) {
                $groups[$groupKey] = $this->emptyDailyGroup(
                    date: $date,
                    employeeId: $employeeId,
                    devicePin: $punch->device_user_id,
                    deviceName: $punch->device?->name,
                    employeeName: $punch->employee
                        ? trim($punch->employee->first_name.' '.$punch->employee->last_name)
                        : 'Unmapped (PIN '.$punch->device_user_id.')',
                    employeeCode: $punch->employee?->employee_code,
                    companyName: $punch->employee?->companyProfile?->company_name,
                );
            }

            $groups[$groupKey]['punches'][] = $punch;
        }

        foreach ($manualEntries ?? [] as $entry) {
            /** @var EmployeeTimeEntry $entry */
            if ($entry->employee_id === null) {
                continue;
            }

            $date = $entry->clock_in_at->format('Y-m-d');
            $groupKey = 'e:'.$entry->employee_id.':'.$date;
            $employee = $entry->employee;

            if (! isset($groups[$groupKey])) {
                $groups[$groupKey] = $this->emptyDailyGroup(
                    date: $date,
                    employeeId: $entry->employee_id,
                    devicePin: trim((string) ($employee?->biometric_user_id ?? '')) !== ''
                        ? (string) $employee->biometric_user_id
                        : '—',
                    deviceName: 'Web check-in',
                    employeeName: $employee
                        ? trim($employee->first_name.' '.$employee->last_name)
                        : 'Employee #'.$entry->employee_id,
                    employeeCode: $employee?->employee_code,
                    companyName: $employee?->companyProfile?->company_name,
                );
            }

            $groups[$groupKey]['time_entry_id'] = $entry->id;

            $groups[$groupKey]['manual_clock_ins'][] = $entry->clock_in_at->format('H:i:s');

            if ($entry->clock_out_at !== null) {
                $groups[$groupKey]['manual_clock_outs'][] = $entry->clock_out_at->format('H:i:s');
            }

            if ($entry->work_mode !== null) {
                $groups[$groupKey]['work_mode_label'] = $entry->workModeLabel();
            }

            if (filled($entry->check_in_remarks)) {
                $groups[$groupKey]['check_in_remarks'] = $entry->check_in_remarks;
            }

            if (filled($entry->check_out_remarks)) {
                $groups[$groupKey]['check_out_remarks'] = $entry->check_out_remarks;
            }

            if (filled($entry->daily_summary)) {
                $groups[$groupKey]['daily_summary'] = $entry->daily_summary;
            }

            if ($entry->check_in_photo_path !== null) {
                $groups[$groupKey]['check_in_photo_url'] = $this->photoPublicUrl($entry->check_in_photo_path);
            }

            if ($entry->check_out_photo_path !== null) {
                $groups[$groupKey]['check_out_photo_url'] = $this->photoPublicUrl($entry->check_out_photo_path);
            }

            if ($entry->check_in_latitude !== null && $entry->check_in_longitude !== null) {
                $groups[$groupKey]['check_in_latitude'] = $entry->check_in_latitude;
                $groups[$groupKey]['check_in_longitude'] = $entry->check_in_longitude;
            }

            if ($entry->check_out_latitude !== null && $entry->check_out_longitude !== null) {
                $groups[$groupKey]['check_out_latitude'] = $entry->check_out_latitude;
                $groups[$groupKey]['check_out_longitude'] = $entry->check_out_longitude;
            }
        }

        $rows = [];

        foreach ($groups as $group) {
            $dayPunches = $group['punches'];
            [$clockIn, $clockOut] = $this->resolveClockTimes($dayPunches);

            if ($group['manual_clock_ins'] !== [] || $group['manual_clock_outs'] !== []) {
                [$clockIn, $clockOut] = $this->mergeManualClockTimes(
                    $clockIn,
                    $clockOut,
                    $group['manual_clock_ins'],
                    $group['manual_clock_outs'],
                );
            }

            [$workingHours, $workingMinutes] = $this->workingDuration(
                $group['date'],
                $clockIn,
                $clockOut,
            );

            $employee = $this->employeeForGroup($group['employee_id'], $employeeMap, $contextEmployee);
            [$overtime, $overtimeMinutes] = $this->overtimeDuration($employee, $group['date'], $workingMinutes);

            $hasBiometric = $dayPunches !== [];
            $hasManual = $group['manual_clock_ins'] !== [];

            $rows[] = [
                'date' => $group['date'],
                'employee_id' => $group['employee_id'],
                'employee_name' => $group['employee_name'],
                'employee_code' => $group['employee_code'],
                'device_pin' => $group['device_pin'],
                'device_name' => $hasBiometric && $hasManual
                    ? trim(($group['device_name'] ?? 'Biometric').' + Web check-in')
                    : ($hasManual ? 'Web check-in' : $group['device_name']),
                'clock_in' => $clockIn,
                'clock_out' => $clockOut,
                'punch_count' => count($dayPunches),
                'working_hours' => $workingHours,
                'working_minutes' => $workingMinutes,
                'overtime' => $overtime,
                'overtime_minutes' => $overtimeMinutes,
                'source' => match (true) {
                    $hasBiometric && $hasManual => 'merged',
                    $hasManual => 'manual',
                    default => 'biometric',
                },
                'work_mode_label' => $group['work_mode_label'],
                'check_in_remarks' => $group['check_in_remarks'],
                'check_out_remarks' => $group['check_out_remarks'],
                'check_in_photo_url' => $group['check_in_photo_url'],
                'check_out_photo_url' => $group['check_out_photo_url'],
                'check_in_latitude' => $group['check_in_latitude'],
                'check_in_longitude' => $group['check_in_longitude'],
                'check_out_latitude' => $group['check_out_latitude'],
                'check_out_longitude' => $group['check_out_longitude'],
                'time_entry_id' => $group['time_entry_id'] ?? null,
                'daily_summary' => $group['daily_summary'] ?? null,
                'company_name' => $group['company_name'] ?? null,
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

    public function openBiometricClockInForEmployeeOnDate(Employee $employee, Carbon $date): ?Carbon
    {
        $dateString = $date->toDateString();

        $punches = BiometricPunch::query()
            ->where('employee_id', $employee->id)
            ->where('punched_at', '>=', $dateString.' 00:00:00')
            ->where('punched_at', '<=', $dateString.' 23:59:59')
            ->orderBy('punched_at')
            ->get();

        if ($punches->isEmpty()) {
            return null;
        }

        [$clockIn, $clockOut] = $this->resolveClockTimes($punches->all());

        if ($clockIn === null || $clockOut !== null) {
            return null;
        }

        return Carbon::parse($dateString.' '.$clockIn, config('app.timezone'));
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

    /**
     * @param  Collection<int, BiometricPunch>  $punches
     * @return array<int, Employee>
     */
    /**
     * @return array{
     *     punches: list<BiometricPunch>,
     *     employee_id: int|null,
     *     device_pin: string,
     *     device_name: string|null,
     *     employee_name: string,
     *     employee_code: string|null,
     *     date: string,
     *     manual_clock_ins: list<string>,
     *     manual_clock_outs: list<string>,
     *     work_mode_label: string|null,
     *     check_in_remarks: string|null,
     *     check_out_remarks: string|null,
     *     check_in_photo_url: string|null,
     *     check_out_photo_url: string|null,
     *     check_in_latitude: float|null,
     *     check_in_longitude: float|null,
     *     check_out_latitude: float|null,
     *     check_out_longitude: float|null,
     * }
     */
    private function emptyDailyGroup(
        string $date,
        ?int $employeeId,
        string $devicePin,
        ?string $deviceName,
        string $employeeName,
        ?string $employeeCode,
        ?string $companyName = null,
    ): array {
        return [
            'date' => $date,
            'employee_id' => $employeeId,
            'device_pin' => $devicePin,
            'device_name' => $deviceName,
            'employee_name' => $employeeName,
            'employee_code' => $employeeCode,
            'company_name' => $companyName,
            'punches' => [],
            'manual_clock_ins' => [],
            'manual_clock_outs' => [],
            'work_mode_label' => null,
            'check_in_remarks' => null,
            'check_out_remarks' => null,
            'check_in_photo_url' => null,
            'check_out_photo_url' => null,
            'check_in_latitude' => null,
            'check_in_longitude' => null,
            'check_out_latitude' => null,
            'check_out_longitude' => null,
            'time_entry_id' => null,
            'daily_summary' => null,
        ];
    }

    private function photoPublicUrl(?string $path): ?string
    {
        if ($path === null || trim($path) === '') {
            return null;
        }

        return PublicStorageUrl::forPath($path);
    }

    /**
     * @param  list<string>  $manualIns
     * @param  list<string>  $manualOuts
     * @return array{0: string|null, 1: string|null}
     */
    private function mergeManualClockTimes(
        ?string $biometricIn,
        ?string $biometricOut,
        array $manualIns,
        array $manualOuts,
    ): array {
        $clockIn = $biometricIn;

        foreach ($manualIns as $manualIn) {
            $clockIn = $clockIn === null ? $manualIn : min($clockIn, $manualIn);
        }

        $clockOut = $biometricOut;

        foreach ($manualOuts as $manualOut) {
            $clockOut = $clockOut === null ? $manualOut : max($clockOut, $manualOut);
        }

        if ($clockIn !== null && $clockOut !== null && $this->minutesBetweenTimes($clockIn, $clockOut) < self::MINIMUM_CHECKOUT_GAP_MINUTES) {
            $clockOut = null;
        }

        return [$clockIn, $clockOut];
    }

    private function manualEntriesQuery(
        string $from,
        string $to,
        ?int $employeeId,
        ?User $viewer,
        ?int $companyProfileId = null,
    ): \Illuminate\Database\Eloquent\Builder {
        $query = EmployeeTimeEntry::query()
            ->with([
                'employee:id,first_name,last_name,employee_code,biometric_user_id,work_timetable_id,company_profile_id',
                'employee.companyProfile:id,company_name',
                'employee.workTimetable.days',
            ])
            ->where('clock_in_at', '>=', $from.' 00:00:00')
            ->where('clock_in_at', '<=', $to.' 23:59:59')
            ->orderBy('clock_in_at');

        if ($viewer !== null) {
            $this->companyScope->scopeRelationViaEmployee($query, $viewer);
        }

        if ($companyProfileId !== null) {
            $query->whereHas('employee', fn ($builder) => $builder->where('company_profile_id', $companyProfileId));
        }

        if ($employeeId !== null) {
            $query->where('employee_id', $employeeId);
        }

        return $query;
    }

    private function employeesWithTimetables(
        Collection $punches,
        ?Employee $contextEmployee,
        ?Collection $manualEntries = null,
    ): array {
        $ids = $punches->pluck('employee_id')->filter()->unique()->values();

        foreach ($manualEntries ?? [] as $entry) {
            /** @var EmployeeTimeEntry $entry */
            if ($entry->employee_id !== null && ! $ids->contains($entry->employee_id)) {
                $ids->push($entry->employee_id);
            }
        }

        if ($contextEmployee !== null && ! $ids->contains($contextEmployee->id)) {
            $ids->push($contextEmployee->id);
        }

        if ($ids->isEmpty() && $contextEmployee === null) {
            return [];
        }

        if ($ids->isEmpty()) {
            $contextEmployee?->loadMissing('workTimetable.days');

            return $contextEmployee !== null ? [$contextEmployee->id => $contextEmployee] : [];
        }

        return Employee::query()
            ->with('workTimetable.days')
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id')
            ->all();
    }

    /**
     * @param  array<int, Employee>  $employeeMap
     */
    private function employeeForGroup(?int $employeeId, array $employeeMap, ?Employee $contextEmployee): ?Employee
    {
        if ($employeeId !== null && isset($employeeMap[$employeeId])) {
            return $employeeMap[$employeeId];
        }

        return $contextEmployee;
    }

    /**
     * @return array{0: string, 1: int|null}
     */
    private function overtimeDuration(?Employee $employee, string $date, ?int $workingMinutes): array
    {
        if ($workingMinutes === null || $employee === null || ! $employee->hasUsableWorkTimetable()) {
            return ['—', null];
        }

        $day = $employee->scheduleDayFor(Carbon::parse($date.' 12:00:00'));

        if ($day === null) {
            return ['—', null];
        }

        $overtimeMinutes = max(0, $workingMinutes - $day->expectedMinutes());

        if ($overtimeMinutes === 0) {
            return ['—', 0];
        }

        return [$this->formatWorkingMinutes($overtimeMinutes), $overtimeMinutes];
    }
}
