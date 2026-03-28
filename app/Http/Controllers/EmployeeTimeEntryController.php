<?php

namespace App\Http\Controllers;

use App\Enums\AttendanceCheckInStatus;
use App\Enums\AttendanceCheckOutStatus;
use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Requests\EmployeeTimeEntry\CheckOutEmployeeTimeEntryRequest;
use App\Http\Requests\EmployeeTimeEntry\DestroyEmployeeTimeEntryRequest;
use App\Http\Requests\EmployeeTimeEntry\StoreEmployeeTimeEntryRequest;
use App\Http\Requests\EmployeeTimeEntry\UpdateEmployeeTimeEntryRequest;
use App\Models\Employee;
use App\Models\EmployeeTimeEntry;
use App\Models\User;
use App\Models\WorkTimetableDay;
use App\Services\AttendanceClassificationService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeTimeEntryController extends Controller
{
    /**
     * Display time entries and the current user’s tagged work timetable.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $query = EmployeeTimeEntry::query()
            ->with(['employee.workTimetable.days'])
            ->orderByDesc('clock_in_at');

        if (! $user->isAdministrator() && $user->employee) {
            $query->where('employee_id', $user->employee->id);
        }

        if ($request->filled('from')) {
            $query->whereDate('clock_in_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('clock_in_at', '<=', $request->input('to'));
        }

        $entries = $query->paginate(20)->withQueryString()->through(
            function (EmployeeTimeEntry $entry): array {
                $day = $entry->employee?->scheduleDayFor($entry->clock_in_at);
                $expectedMins = $day !== null && ! $day->is_rest_day ? $day->expectedMinutes() : null;
                $worked = $entry->workedMinutes();

                return [
                    'id' => $entry->id,
                    'employee_id' => $entry->employee_id,
                    'employee_name' => $entry->employee
                        ? "{$entry->employee->first_name} {$entry->employee->last_name}"
                        : '',
                    'clock_in_at' => $entry->clock_in_at->toIso8601String(),
                    'clock_out_at' => $entry->clock_out_at?->toIso8601String(),
                    'daily_summary' => $entry->daily_summary,
                    'worked_minutes' => $worked,
                    'expected_minutes' => $expectedMins,
                    'minutes_variance' => ($expectedMins !== null && $worked !== null)
                        ? ($worked - $expectedMins)
                        : null,
                    'expected_label' => $this->expectedLabelForEntry($entry),
                    'check_in_status' => $entry->check_in_status,
                    'check_in_status_label' => AttendanceCheckInStatus::tryFrom((string) ($entry->check_in_status ?? ''))?->label() ?? '—',
                    'check_out_status' => $entry->check_out_status,
                    'check_out_status_label' => AttendanceCheckOutStatus::tryFrom((string) ($entry->check_out_status ?? ''))?->label() ?? '—',
                ];
            }
        );

        $workSchedule = null;
        $openEntry = null;
        $canCheckIn = false;

        if ($user->employee) {
            $user->employee->loadMissing('workTimetable.days');
            if ($user->employee->workTimetable) {
                $workSchedule = $user->employee->workTimetable->days->map(
                    function (WorkTimetableDay $d): array {
                        return [
                            'weekday' => $d->weekday,
                            'weekday_label' => WorkTimetableDay::weekdayLabels()[$d->weekday] ?? (string) $d->weekday,
                            'is_rest_day' => $d->is_rest_day,
                            'work_starts_at' => $d->work_starts_at,
                            'work_ends_at' => $d->work_ends_at,
                            'expected_minutes' => $d->expectedMinutes(),
                        ];
                    }
                )->values()->all();
            }

            $openEntry = EmployeeTimeEntry::query()
                ->where('employee_id', $user->employee->id)
                ->whereNull('clock_out_at')
                ->latest('clock_in_at')
                ->first();

            $canCheckIn = $user->employee->hasUsableWorkTimetable()
                && $openEntry === null
                && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::View);
        }

        if ($user->isAdministrator()) {
            $canCheckIn = Employee::query()->exists()
                && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::CheckIn);
        }

        $employeesForCheckIn = $user->isAdministrator()
            && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::CheckIn)
            ? Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name'])
                ->map(fn (Employee $e): array => [
                    'id' => $e->id,
                    'name' => "{$e->first_name} {$e->last_name}",
                ])
                ->values()
                ->all()
            : [];

        return Inertia::render('time-attendance/index', [
            'entries' => $entries,
            'filters' => $request->only(['from', 'to']),
            'workSchedule' => $workSchedule,
            'graceMinutes' => (int) config('attendance.grace_minutes', 5),
            'openEntry' => $openEntry
                ? [
                    'id' => $openEntry->id,
                    'clock_in_at' => $openEntry->clock_in_at->toIso8601String(),
                ]
                : null,
            'canCheckIn' => $canCheckIn,
            'isAdministrator' => $user->isAdministrator(),
            'employeesForCheckIn' => $employeesForCheckIn,
        ]);
    }

    /**
     * Check in (start an open time entry).
     */
    public function store(StoreEmployeeTimeEntryRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $employeeId = $user->isAdministrator()
            ? (int) $request->validated('employee_id')
            : (int) $user->employee->id;

        $employee = Employee::query()->findOrFail($employeeId);

        if (! $employee->hasUsableWorkTimetable()) {
            return back()->withErrors([
                'check_in' => 'This employee must be tagged with a complete work timetable (seven weekdays) before checking in.',
            ]);
        }

        if (EmployeeTimeEntry::query()->where('employee_id', $employee->id)->whereNull('clock_out_at')->exists()) {
            return back()->withErrors([
                'check_in' => 'An open check-in already exists for this employee. Check out first.',
            ]);
        }

        $entry = EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => now(),
        ]);
        $entry->recalculateAttendanceStatuses(app(AttendanceClassificationService::class));
        $entry->save();

        return to_route('time-attendance.index')->with('success', 'Checked in.');
    }

    /**
     * Check out the current user’s open entry (employees only).
     */
    public function checkOut(CheckOutEmployeeTimeEntryRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        $summary = $data['daily_summary'] ?? null;
        if (is_string($summary)) {
            $summary = trim($summary);
            if ($summary === '') {
                $summary = null;
            }
        }

        $entry = EmployeeTimeEntry::query()
            ->where('employee_id', $user->employee->id)
            ->whereNull('clock_out_at')
            ->latest('clock_in_at')
            ->first();

        if ($entry === null) {
            return back()->withErrors([
                'check_out' => 'No open check-in to complete.',
            ]);
        }

        $entry->update([
            'clock_out_at' => now(),
            'daily_summary' => $summary,
        ]);
        $entry->recalculateAttendanceStatuses(app(AttendanceClassificationService::class));
        $entry->save();

        return to_route('time-attendance.index')->with('success', 'Checked out.');
    }

    /**
     * Update a time entry (admin corrections or completing check-out by id).
     */
    public function update(UpdateEmployeeTimeEntryRequest $request, EmployeeTimeEntry $employee_time_entry): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        if ($user->isAdministrator()) {
            if (array_key_exists('clock_in_at', $data)) {
                $employee_time_entry->clock_in_at = $data['clock_in_at'];
            }
            if (array_key_exists('clock_out_at', $data)) {
                $employee_time_entry->clock_out_at = $data['clock_out_at'];
            }
            if (array_key_exists('daily_summary', $data)) {
                $s = $data['daily_summary'];
                if (is_string($s)) {
                    $s = trim($s);
                    $employee_time_entry->daily_summary = $s === '' ? null : $s;
                } else {
                    $employee_time_entry->daily_summary = null;
                }
            }
            $employee_time_entry->save();
        } else {
            $summary = $data['daily_summary'] ?? null;
            if (is_string($summary)) {
                $summary = trim($summary);
                if ($summary === '') {
                    $summary = null;
                }
            }

            $employee_time_entry->update([
                'clock_out_at' => isset($data['clock_out_at'])
                    ? $data['clock_out_at']
                    : now(),
                'daily_summary' => $summary,
            ]);
        }

        $employee_time_entry->recalculateAttendanceStatuses(app(AttendanceClassificationService::class));
        $employee_time_entry->save();

        return to_route('time-attendance.index')->with('success', 'Time entry updated.');
    }

    /**
     * Remove a time entry (administrators only).
     */
    public function destroy(DestroyEmployeeTimeEntryRequest $request, EmployeeTimeEntry $employee_time_entry): RedirectResponse
    {
        $employee_time_entry->delete();

        return to_route('time-attendance.index')->with('success', 'Time entry removed.');
    }

    private function expectedLabelForEntry(EmployeeTimeEntry $entry): string
    {
        $employee = $entry->employee;

        if ($employee === null) {
            return '—';
        }

        $row = $employee->scheduleDayFor($entry->clock_in_at);

        if ($row === null) {
            return '—';
        }

        if ($row->is_rest_day) {
            return 'Rest (scheduled)';
        }

        $start = Carbon::parse($row->work_starts_at)->format('H:i');
        $end = Carbon::parse($row->work_ends_at)->format('H:i');
        $minutes = $row->expectedMinutes();
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;

        return sprintf('%s–%s (%dh %dm)', $start, $end, $h, $m);
    }
}