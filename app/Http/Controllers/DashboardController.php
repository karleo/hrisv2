<?php

namespace App\Http\Controllers;

use App\Enums\AttendanceWorkMode;
use App\Enums\ItAssetCategory;
use App\Enums\ItAssetStatus;
use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\Department;
use App\Models\EmployeeRequest;
use App\Models\ItAsset;
use App\Models\ItRequest;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Services\EmployeeAttendanceStateService;
use App\Support\CompanyAccessScope;
use App\Support\RequestApprovalScope;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly RequestApprovalScope $approvalScope,
        private readonly CompanyAccessScope $companyScope,
        private readonly EmployeeAttendanceStateService $attendanceState,
    ) {}

    /**
     * Build minimal attendance context for the dashboard quick-action card.
     *
     * @return array<string, mixed>|null
     */
    private function buildAttendanceProps(?User $user): ?array
    {
        if ($user === null || $user->employee === null) {
            return null;
        }

        $employee = $user->employee;

        // Employee must have a timetable assigned before they can check in.
        // Admins with a linked employee are treated like regular employees for self-check-in.
        $canCheckIn = $employee->hasUsableWorkTimetable()
            && (
                $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::View)
                || $user->isAdministrator()
            );

        $openEntry = $this->attendanceState->resolveOpenAttendance($employee);

        if ($openEntry !== null) {
            // Already checked in — cannot check in again until checked out
            $canCheckIn = false;
        }

        $workModeOptions = array_map(
            fn (AttendanceWorkMode $mode): array => [
                'value' => $mode->value,
                'label' => $mode->label(),
                'is_field' => $mode->isField(),
            ],
            AttendanceWorkMode::cases()
        );

        return [
            'can_check_in' => $canCheckIn,
            'open_entry' => $openEntry,
            'work_mode_options' => $workModeOptions,
        ];
    }

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $currentEmployeeDepartmentId = $user?->employee?->department_id;
        $managedDepartmentIds = $user !== null ? $this->approvalScope->managedDepartmentIds($user) : [];
        $hasScopedDepartmentAccess = $managedDepartmentIds !== []
            || $currentEmployeeDepartmentId !== null;
        $isDepartmentManager = $managedDepartmentIds !== [];
        $canViewLeaveCalendar = $user !== null
            && (
                $isDepartmentManager
                || $user->hasModuleAbility(PermissionModule::LeaveCalendar, ModuleAbility::View)
            )
            && (
                $this->approvalScope->isAdministratorOrHr($user)
                || $hasScopedDepartmentAccess
            );

        $leavePending = LeaveRequest::query()->where('status', 'submitted');
        $this->approvalScope->scopeVisible($leavePending, $user);

        $employeePending = EmployeeRequest::query()->where('status', 'submitted');
        $this->approvalScope->scopeVisible($employeePending, $user);

        $itPending = ItRequest::query()->where('status', 'submitted');
        $this->approvalScope->scopeVisible($itPending, $user);

        $itAssetStats = [
            'total' => ItAsset::query()->count(),
            'available' => ItAsset::query()->where('status', ItAssetStatus::Available)->count(),
            'assigned' => ItAsset::query()->where('status', ItAssetStatus::Assigned)->count(),
            'hardware' => ItAsset::query()->where('category', ItAssetCategory::Hardware)->count(),
            'software' => ItAsset::query()->where('category', ItAssetCategory::Software)->count(),
            'accessory' => ItAsset::query()->where('category', ItAssetCategory::Accessory)->count(),
        ];

        $leaveCalendarWidget = null;
        if ($canViewLeaveCalendar) {
            $today = Carbon::today();
            $monthStart = (clone $today)->startOfMonth();
            $monthEnd = (clone $today)->endOfMonth();
            $upcomingWindowEnd = (clone $today)->addDays(7);

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
            $approvedLeaves = $approvedLeavesQuery
                ->orderBy('period_from')
                ->get();

            $entries = $approvedLeaves->map(function (LeaveRequest $leaveRequest) use ($leaveTypeCategories): array {
                $types = is_array($leaveRequest->absence_types) ? $leaveRequest->absence_types : [];
                $leaveType = (string) ($types[0] ?? '');

                return [
                    'id' => (int) $leaveRequest->id,
                    'employee_name' => trim((string) ($leaveRequest->employee?->first_name ?? '').' '.(string) ($leaveRequest->employee?->last_name ?? '')),
                    'department_name' => (string) ($leaveRequest->department?->name ?? '—'),
                    'leave_type' => $leaveType !== '' ? $leaveType : (string) ($leaveRequest->absence_other ?? 'Others'),
                    'leave_category' => $leaveTypeCategories[$leaveType] ?? 'paid',
                    'period_from' => (string) ($leaveRequest->period_from ?? ''),
                    'period_to' => (string) ($leaveRequest->period_to ?? ''),
                ];
            })->values();

            $calendarDayCounts = [];
            foreach ($entries as $entry) {
                $from = Carbon::parse((string) $entry['period_from']);
                $to = Carbon::parse((string) $entry['period_to']);
                $effectiveStart = $from->greaterThan($monthStart) ? $from : (clone $monthStart);
                $effectiveEnd = $to->lessThan($monthEnd) ? $to : (clone $monthEnd);

                for ($cursor = (clone $effectiveStart); $cursor->lte($effectiveEnd); $cursor->addDay()) {
                    $key = $cursor->toDateString();
                    $calendarDayCounts[$key] = ($calendarDayCounts[$key] ?? 0) + 1;
                }
            }

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

            $isGlobalAdmin = $user !== null && $this->companyScope->isGlobalAdmin($user);
            $allowedDepartmentIds = array_values(array_unique(array_filter(
                [
                    ...$managedDepartmentIds,
                    $currentEmployeeDepartmentId !== null ? (int) $currentEmployeeDepartmentId : null,
                ],
                static fn ($id): bool => $id !== null
            )));
            $departmentsQuery = Department::query();
            if ($isGlobalAdmin) {
                // No filter — administrators see all departments.
            } elseif ($this->companyScope->shouldScope($user)) {
                $this->companyScope->scopeDepartmentsWithCompanyEmployees($departmentsQuery, $user);
            } elseif ($allowedDepartmentIds !== []) {
                $departmentsQuery->whereIn('id', $allowedDepartmentIds);
            } else {
                $departmentsQuery->whereRaw('1 = 0');
            }
            $departmentsCount = $departmentsQuery->count();

            $leaveCalendarWidget = [
                'monthLabel' => $monthStart->format('F Y'),
                'monthStart' => $monthStart->toDateString(),
                'monthEnd' => $monthEnd->toDateString(),
                'today' => $today->toDateString(),
                'calendarDayCounts' => $calendarDayCounts,
                'todayOnLeave' => $todayOnLeave,
                'upcomingLeaves' => $upcomingLeaves,
                'departmentsCount' => $departmentsCount,
            ];
        }

        // Build attendance quick-action props for linked employees
        $attendanceProps = $this->buildAttendanceProps($user);

        return Inertia::render('dashboard', [
            'attendance' => $attendanceProps,
            'pending' => [
                'leave_requests' => $leavePending->count(),
                'employee_requests' => $employeePending->count(),
                'it_requests' => $itPending->count(),
            ],
            'itAssetStats' => $itAssetStats,
            'recentPending' => [
                'leave_requests' => tap(
                    LeaveRequest::query()
                        ->where('status', 'submitted')
                        ->with('employee:id,first_name,last_name'),
                    fn ($query) => $this->approvalScope->scopeVisible($query, $user)
                )->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn (LeaveRequest $item) => [
                        'id' => $item->id,
                        'code' => $item->code,
                        'employee' => trim(($item->employee?->first_name ?? '').' '.($item->employee?->last_name ?? '')),
                    ]),
                'employee_requests' => tap(
                    EmployeeRequest::query()
                        ->where('status', 'submitted')
                        ->with('employee:id,first_name,last_name'),
                    fn ($query) => $this->approvalScope->scopeVisible($query, $user)
                )->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn (EmployeeRequest $item) => [
                        'id' => $item->id,
                        'code' => $item->code,
                        'employee' => trim(($item->employee?->first_name ?? '').' '.($item->employee?->last_name ?? '')),
                    ]),
                'it_requests' => tap(
                    ItRequest::query()
                        ->where('status', 'submitted')
                        ->with('employee:id,first_name,last_name'),
                    fn ($query) => $this->approvalScope->scopeVisible($query, $user)
                )->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn (ItRequest $item) => [
                        'id' => $item->id,
                        'code' => (string) $item->id,
                        'employee' => trim(($item->employee?->first_name ?? '').' '.($item->employee?->last_name ?? '')),
                    ]),
            ],
            'leaveCalendarWidget' => $leaveCalendarWidget,
            'canViewLeaveCalendar' => $canViewLeaveCalendar,
        ]);
    }
}
