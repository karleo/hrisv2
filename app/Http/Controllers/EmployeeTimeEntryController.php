<?php

namespace App\Http\Controllers;

use App\Enums\AttendanceCheckInStatus;
use App\Enums\AttendanceCheckOutStatus;
use App\Enums\AttendanceWorkMode;
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
use App\Services\AttendanceDurationService;
use App\Support\CompanyAccessScope;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeTimeEntryController extends Controller
{
    public function __construct(private readonly CompanyAccessScope $companyScope) {}

    /**
     * Display time entries and the current user's tagged work timetable.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $query = EmployeeTimeEntry::query()
            ->with(['employee.workTimetable.days'])
            ->orderByDesc('clock_in_at');

        if ($this->companyScope->isGlobalAdmin($user)) {
            // Administrators see all time entries
        } elseif ($this->companyScope->shouldScope($user)) {
            $this->companyScope->scopeRelationViaEmployee($query, $user);
        } elseif ($user->employee) {
            $query->where('employee_id', $user->employee->id);
        } else {
            $query->whereRaw('1 = 0');
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
                    'work_mode' => $entry->work_mode?->value,
                    'work_mode_label' => $entry->workModeLabel(),
                    'requires_field_evidence' => $entry->requiresFieldEvidence(),
                    'check_in_remarks' => $entry->check_in_remarks,
                    'check_out_remarks' => $entry->check_out_remarks,
                    'has_check_in_photo' => $entry->check_in_photo_path !== null,
                    'has_check_out_photo' => $entry->check_out_photo_path !== null,
                    'check_in_photo_url' => $this->photoPublicUrl($entry->check_in_photo_path),
                    'check_out_photo_url' => $this->photoPublicUrl($entry->check_out_photo_path),
                    'check_in_latitude' => $entry->check_in_latitude,
                    'check_in_longitude' => $entry->check_in_longitude,
                    'check_out_latitude' => $entry->check_out_latitude,
                    'check_out_longitude' => $entry->check_out_longitude,
                    'worked_minutes' => $worked,
                    'overtime_minutes' => $entry->overtime_minutes,
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

        // Admins who also have a linked employee can check in for themselves via the dialog
        if ($user->isAdministrator() && $user->employee) {
            $canCheckIn = $user->employee->hasUsableWorkTimetable()
                && $openEntry === null;
        } elseif ($user->isAdministrator()) {
            // Pure admins without a linked employee keep the old admin check-in flow
            $canCheckIn = $this->companyScope->scopedEmployeeQuery($user)->exists()
                && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::CheckIn);
        }

        $employeesForCheckIn = $user->isAdministrator()
            && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::CheckIn)
            ? $this->companyScope->scopedEmployeeQuery($user)
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

        // Work mode options for the check-in dialog
        $workModeOptions = array_map(
            fn (AttendanceWorkMode $mode): array => [
                'value' => $mode->value,
                'label' => $mode->label(),
                'is_field' => $mode->isField(),
            ],
            AttendanceWorkMode::cases()
        );

        return Inertia::render('time-attendance/index', [
            'entries' => $entries,
            'filters' => $request->only(['from', 'to']),
            'workSchedule' => $workSchedule,
            'graceMinutes' => (int) config('attendance.grace_minutes', 5),
            'openEntry' => $openEntry
                ? [
                    'id' => $openEntry->id,
                    'clock_in_at' => $openEntry->clock_in_at->toIso8601String(),
                    'work_mode' => $openEntry->work_mode?->value,
                    'work_mode_label' => $openEntry->workModeLabel(),
                    'requires_field_evidence' => $openEntry->requiresFieldEvidence(),
                ]
                : null,
            'canCheckIn' => $canCheckIn,
            'isAdministrator' => $user->isAdministrator(),
            'employeesForCheckIn' => $employeesForCheckIn,
            'workModeOptions' => $workModeOptions,
        ]);
    }

    /**
     * Check in (start an open time entry).
     */
    public function store(StoreEmployeeTimeEntryRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Admin checking in for another employee (explicit employee_id sent)
        // Admin self-check-in (no employee_id but has linked employee) — same as regular employee
        if ($user->isAdministrator() && $request->filled('employee_id')) {
            $employeeId = (int) $request->validated('employee_id');
        } elseif ($user->employee) {
            $employeeId = (int) $user->employee->id;
        } else {
            return back()->withErrors([
                'check_in' => 'No employee profile linked to this account.',
            ]);
        }

        $employee = Employee::query()->findOrFail($employeeId);

        if ($user->isAdministrator() && $request->filled('employee_id')) {
            $this->companyScope->assertCanAccessEmployee($user, $employee);
        }

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

        // Determine work mode; admin defaults to WFH if not provided
        $workModeValue = $request->validated('work_mode');
        $workMode = $workModeValue
            ? AttendanceWorkMode::from((string) $workModeValue)
            : AttendanceWorkMode::WorkFromHome;

        // Create the entry first so we have an ID for the storage path
        $entry = EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => now(),
            'work_mode' => $workMode->value,
        ]);

        // Store check-in photo if provided
        $photoPath = null;
        if ($request->hasFile('check_in_photo')) {
            $photoPath = $request->file('check_in_photo')
                ->store("employees/{$employee->id}/attendance/{$entry->id}", 'public');
        }

        // Persist field evidence and remarks
        $entry->check_in_photo_path = $photoPath;
        $entry->check_in_latitude = $request->validated('check_in_latitude');
        $entry->check_in_longitude = $request->validated('check_in_longitude');
        $entry->check_in_remarks = $request->validated('check_in_remarks');

        $entry->recalculateAttendanceStatuses(app(AttendanceClassificationService::class));
        $entry->save();

        return to_route('time-attendance.index')->with('success', 'Checked in.');
    }

    /**
     * Check out the current user's open entry (employees only).
     */
    public function checkOut(CheckOutEmployeeTimeEntryRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        if ($user->employee === null) {
            return back()->withErrors([
                'check_out' => 'No employee profile linked to this account.',
            ]);
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

        // Store check-out photo if provided
        $photoPath = null;
        if ($request->hasFile('check_out_photo')) {
            $photoPath = $request->file('check_out_photo')
                ->store("employees/{$user->employee->id}/attendance/{$entry->id}", 'public');
        }

        $dailySummary = isset($data['daily_summary']) ? trim((string) $data['daily_summary']) : null;
        if ($dailySummary === '') {
            $dailySummary = null;
        }

        $entry->clock_out_at = now();
        $entry->daily_summary = $dailySummary;
        $entry->check_out_photo_path = $photoPath;
        $entry->check_out_latitude = $data['check_out_latitude'] ?? null;
        $entry->check_out_longitude = $data['check_out_longitude'] ?? null;
        $entry->check_out_remarks = isset($data['check_out_remarks']) ? (trim((string) $data['check_out_remarks']) ?: null) : null;

        // Compute and persist worked hours and overtime
        $entry->calculateAndPersistWorkedTime(app(AttendanceDurationService::class));
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

        // Recalculate durations and statuses after admin correction
        if ($employee_time_entry->clock_out_at !== null) {
            $employee_time_entry->calculateAndPersistWorkedTime(app(AttendanceDurationService::class));
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
        // Clean up any stored attendance photos before deleting the record
        if ($employee_time_entry->check_in_photo_path) {
            Storage::disk('public')->delete($employee_time_entry->check_in_photo_path);
        }

        if ($employee_time_entry->check_out_photo_path) {
            Storage::disk('public')->delete($employee_time_entry->check_out_photo_path);
        }

        $employee_time_entry->delete();

        return to_route('time-attendance.index')->with('success', 'Time entry removed.');
    }

    private function photoPublicUrl(?string $path): ?string
    {
        if ($path === null || trim($path) === '') {
            return null;
        }

        return '/storage/'.str_replace('\\', '/', ltrim($path, '/'));
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
