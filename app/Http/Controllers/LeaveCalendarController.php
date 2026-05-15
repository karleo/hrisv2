<?php

namespace App\Http\Controllers;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\Department;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Support\RequestApprovalScope;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveCalendarController extends Controller
{
    public function __construct(private readonly RequestApprovalScope $approvalScope) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $this->assertCanAccess($user);

        $filters = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
            'department_id' => ['nullable', 'integer'],
            'leave_type' => ['nullable', 'string', 'max:255'],
        ]);

        $month = (string) ($filters['month'] ?? now()->format('Y-m'));
        $monthStart = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $monthEnd = (clone $monthStart)->endOfMonth();
        $today = Carbon::today();
        $upcomingWindowEnd = (clone $today)->addDays(7);

        $managedDepartmentIds = $user instanceof User
            ? $this->approvalScope->managedDepartmentIds($user)
            : [];
        $currentEmployeeDepartmentId = $user?->employee?->department_id;
        $isAdminOrHr = $user instanceof User
            ? $this->approvalScope->isAdministratorOrHr($user)
            : false;
        $allowedDepartmentIds = array_values(array_unique(array_filter(
            [
                ...$managedDepartmentIds,
                $currentEmployeeDepartmentId !== null ? (int) $currentEmployeeDepartmentId : null,
            ],
            static fn ($id): bool => $id !== null
        )));

        $departmentFilterId = isset($filters['department_id']) ? (int) $filters['department_id'] : null;
        if (! $isAdminOrHr && $departmentFilterId !== null && ! in_array($departmentFilterId, $allowedDepartmentIds, true)) {
            abort(403);
        }

        $leaveTypeCategories = LeaveType::query()
            ->pluck('leave_category', 'name')
            ->mapWithKeys(static fn ($category, $name): array => [(string) $name => (string) $category])
            ->all();

        $approvedLeavesQuery = LeaveRequest::query()
            ->where('status', 'approved')
            ->whereNotNull('period_from')
            ->whereNotNull('period_to')
            ->whereDate('period_from', '<=', $monthEnd->toDateString())
            ->whereDate('period_to', '>=', $monthStart->toDateString())
            ->with(['employee:id,first_name,last_name', 'department:id,name']);

        $this->approvalScope->scopeVisible($approvedLeavesQuery, $user);

        if ($departmentFilterId !== null) {
            $approvedLeavesQuery->where('department_id', $departmentFilterId);
        }

        $leaveTypeFilter = isset($filters['leave_type']) ? trim((string) $filters['leave_type']) : '';
        if ($leaveTypeFilter !== '') {
            $approvedLeavesQuery->whereJsonContains('absence_types', $leaveTypeFilter);
        }

        $approvedLeaves = $approvedLeavesQuery
            ->orderBy('period_from')
            ->orderBy('employee_id')
            ->get();

        $entries = $approvedLeaves->map(function (LeaveRequest $leaveRequest) use ($leaveTypeCategories): array {
            $types = is_array($leaveRequest->absence_types) ? $leaveRequest->absence_types : [];
            $leaveType = (string) ($types[0] ?? '');
            $from = (string) ($leaveRequest->period_from ?? '');
            $to = (string) ($leaveRequest->period_to ?? '');

            return [
                'id' => (int) $leaveRequest->id,
                'employee_name' => trim((string) ($leaveRequest->employee?->first_name ?? '').' '.(string) ($leaveRequest->employee?->last_name ?? '')),
                'department_name' => (string) ($leaveRequest->department?->name ?? '—'),
                'leave_type' => $leaveType !== '' ? $leaveType : (string) ($leaveRequest->absence_other ?? 'Others'),
                'leave_category' => $leaveTypeCategories[$leaveType] ?? 'paid',
                'period_from' => $from,
                'period_to' => $to,
                'days' => (int) ($leaveRequest->days ?? 0),
            ];
        })->values();

        $calendarDayCounts = [];
        $calendarDayLeaves = [];
        foreach ($entries as $entry) {
            $from = Carbon::parse((string) $entry['period_from']);
            $to = Carbon::parse((string) $entry['period_to']);
            $effectiveStart = $from->greaterThan($monthStart) ? $from : (clone $monthStart);
            $effectiveEnd = $to->lessThan($monthEnd) ? $to : (clone $monthEnd);

            for ($cursor = (clone $effectiveStart); $cursor->lte($effectiveEnd); $cursor->addDay()) {
                $key = $cursor->toDateString();
                $calendarDayCounts[$key] = ($calendarDayCounts[$key] ?? 0) + 1;
                $calendarDayLeaves[$key] ??= [];
                $calendarDayLeaves[$key][] = [
                    'id' => (int) $entry['id'],
                    'employee_name' => (string) $entry['employee_name'],
                    'leave_type' => (string) $entry['leave_type'],
                ];
            }
        }

        foreach ($calendarDayLeaves as &$dayLeaves) {
            usort(
                $dayLeaves,
                static fn (array $a, array $b): int => strcmp(
                    (string) $a['employee_name'],
                    (string) $b['employee_name'],
                ),
            );
        }
        unset($dayLeaves);

        $todayOnLeave = $entries
            ->filter(static function (array $entry) use ($today): bool {
                return Carbon::parse((string) $entry['period_from'])->lte($today)
                    && Carbon::parse((string) $entry['period_to'])->gte($today);
            })
            ->values()
            ->all();

        $upcomingLeaves = $entries
            ->filter(static function (array $entry) use ($today, $upcomingWindowEnd): bool {
                $from = Carbon::parse((string) $entry['period_from']);

                return $from->gt($today) && $from->lte($upcomingWindowEnd);
            })
            ->sortBy('period_from')
            ->values()
            ->all();

        $departmentSummary = collect($entries)
            ->groupBy('department_name')
            ->map(static function ($group, $departmentName): array {
                $employees = collect($group)
                    ->pluck('employee_name')
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();

                return [
                    'department_name' => (string) $departmentName,
                    'leave_entries' => $group->count(),
                    'total_days' => (int) $group->sum('days'),
                    'employees_on_leave' => count($employees),
                ];
            })
            ->sortByDesc('leave_entries')
            ->values()
            ->all();

        $departments = Department::query()
            ->when(
                ! $isAdminOrHr,
                fn ($query) => $query->whereIn('id', $allowedDepartmentIds)
            )
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (Department $department): array => [
                'id' => (int) $department->id,
                'name' => (string) $department->name,
            ])
            ->values()
            ->all();

        $leaveTypes = LeaveType::query()
            ->orderBy('name')
            ->get(['name', 'leave_category'])
            ->map(static fn (LeaveType $leaveType): array => [
                'name' => (string) $leaveType->name,
                'leave_category' => (string) $leaveType->leave_category,
            ])
            ->values()
            ->all();

        return Inertia::render('leave-calendar/index', [
            'filters' => [
                'month' => $month,
                'department_id' => $departmentFilterId,
                'leave_type' => $leaveTypeFilter !== '' ? $leaveTypeFilter : null,
            ],
            'meta' => [
                'month' => $month,
                'monthLabel' => $monthStart->format('F Y'),
                'monthStart' => $monthStart->toDateString(),
                'monthEnd' => $monthEnd->toDateString(),
                'today' => $today->toDateString(),
            ],
            'departments' => $departments,
            'leaveTypes' => $leaveTypes,
            'entries' => $entries,
            'calendarDayCounts' => $calendarDayCounts,
            'calendarDayLeaves' => $calendarDayLeaves,
            'todayOnLeave' => $todayOnLeave,
            'upcomingLeaves' => $upcomingLeaves,
            'departmentSummary' => $departmentSummary,
        ]);
    }

    public function canAccess(?User $user): bool
    {
        if (! $user instanceof User) {
            return false;
        }

        // Department managers should access Leave Calendar by default.
        if ($this->approvalScope->managedDepartmentIds($user) !== []) {
            return true;
        }

        if (! $user->hasModuleAbility(PermissionModule::LeaveCalendar, ModuleAbility::View)) {
            return false;
        }

        if ($this->approvalScope->isAdministratorOrHr($user)) {
            return true;
        }

        return $this->approvalScope->managedDepartmentIds($user) !== []
            || $user->employee()->exists();
    }

    private function assertCanAccess(?User $user): void
    {
        if (! $this->canAccess($user)) {
            abort(403);
        }
    }
}
