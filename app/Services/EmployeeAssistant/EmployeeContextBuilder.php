<?php

namespace App\Services\EmployeeAssistant;

use App\Models\Employee;
use App\Models\EmployeeRequest;
use App\Models\ItAssetAssignment;
use App\Models\ItRequest;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Services\Reports\AttendanceReportService;
use Illuminate\Support\Carbon;

class EmployeeContextBuilder
{
    public function __construct(
        private readonly AttendanceReportService $attendanceReportService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function buildForEmployee(Employee $employee): array
    {
        $employee->loadMissing([
            'department:id,name',
            'jobPosition:id,name',
            'companyProfile:id,company_name',
            'workTimetable:id,name',
        ]);

        $paidLeaveTypeNames = LeaveType::query()
            ->where('leave_category', 'paid')
            ->pluck('name')
            ->filter(static fn ($name): bool => is_string($name) && $name !== '')
            ->values()
            ->all();

        $approvedLeaveUsage = LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->orderByDesc('decided_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get(['id', 'absence_types', 'absence_other', 'period_from', 'period_to', 'days', 'status', 'decided_at']);

        $approvedDaysUsed = (float) LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->get(['absence_types', 'days'])
            ->sum(function (LeaveRequest $leaveRequest) use ($paidLeaveTypeNames): float {
                $types = is_array($leaveRequest->absence_types) ? $leaveRequest->absence_types : [];
                $leaveType = (string) ($types[0] ?? '');
                if ($leaveType === '' || ! in_array($leaveType, $paidLeaveTypeNames, true)) {
                    return 0.0;
                }

                return (float) ($leaveRequest->days ?? 0);
            });

        $openingBalance = (float) ($employee->leave_opening_balance ?? 0);

        $leaveCategoryByName = LeaveType::query()
            ->pluck('leave_category', 'name')
            ->mapWithKeys(static fn ($category, $name): array => [(string) $name => (string) $category])
            ->all();

        $to = now()->toDateString();
        $from = Carbon::parse($to)->subDays(30)->toDateString();
        $attendanceReport = $this->attendanceReportService->buildForEmployee($employee, $from, $to);

        return [
            'profile' => [
                'employee_code' => $employee->employee_code,
                'full_name' => trim($employee->first_name.' '.$employee->last_name),
                'department' => $employee->department?->name,
                'job_position' => $employee->jobPosition?->name,
                'company' => $employee->companyProfile?->company_name,
                'work_timetable' => $employee->workTimetable?->name,
                'employee_status' => $employee->employee_status,
                'joining_date' => $employee->joining_date?->toDateString(),
            ],
            'leave' => [
                'opening_balance' => $openingBalance,
                'approved_days_used' => $approvedDaysUsed,
                'remaining_balance' => $openingBalance - $approvedDaysUsed,
                'recent_approved' => $approvedLeaveUsage->map(function (LeaveRequest $leaveRequest) use ($leaveCategoryByName): array {
                    $types = is_array($leaveRequest->absence_types) ? $leaveRequest->absence_types : [];
                    $leaveType = (string) ($types[0] ?? '');

                    return [
                        'leave_type' => $leaveType !== ''
                            ? $leaveType
                            : (string) ($leaveRequest->absence_other ?: '—'),
                        'leave_category' => $leaveCategoryByName[$leaveType] ?? 'paid',
                        'period_from' => $leaveRequest->period_from,
                        'period_to' => $leaveRequest->period_to,
                        'days' => $leaveRequest->days,
                        'decided_at' => $leaveRequest->decided_at?->toDateString(),
                    ];
                })->values()->all(),
            ],
            'leave_types' => collect($leaveCategoryByName)
                ->map(static fn (string $category, string $name): array => [
                    'name' => $name,
                    'category' => $category,
                ])
                ->values()
                ->all(),
            'requests' => [
                'leave' => $this->recentRequests(
                    LeaveRequest::query()
                        ->where('employee_id', $employee->id)
                        ->orderByDesc('updated_at')
                        ->limit(5),
                    static fn (LeaveRequest $request): array => [
                        'code' => $request->code,
                        'status' => $request->status,
                        'period_from' => $request->period_from,
                        'period_to' => $request->period_to,
                        'days' => $request->days,
                    ],
                ),
                'it' => $this->recentRequests(
                    ItRequest::query()
                        ->where('employee_id', $employee->id)
                        ->orderByDesc('updated_at')
                        ->limit(5),
                    static fn (ItRequest $request): array => [
                        'status' => $request->status,
                        'date' => $request->date?->toDateString(),
                    ],
                ),
                'employee' => $this->recentRequests(
                    EmployeeRequest::query()
                        ->where('employee_id', $employee->id)
                        ->orderByDesc('updated_at')
                        ->limit(5),
                    static fn (EmployeeRequest $request): array => [
                        'code' => $request->code,
                        'status' => $request->status,
                        'date' => $request->date,
                    ],
                ),
                'it_asset' => $this->recentRequests(
                    ItAssetAssignment::query()
                        ->where('employee_id', $employee->id)
                        ->whereNull('returned_at')
                        ->with('itAsset:id,code,category,name,status')
                        ->orderByDesc('assigned_at')
                        ->limit(5),
                    static fn (ItAssetAssignment $assignment): array => [
                        'code' => $assignment->itAsset?->code,
                        'category' => $assignment->itAsset?->category?->value,
                        'name' => $assignment->itAsset?->name,
                        'status' => $assignment->itAsset?->status?->value,
                        'assigned_at' => $assignment->assigned_at?->toDateString(),
                    ],
                ),
            ],
            'attendance' => [
                'period_from' => $from,
                'period_to' => $to,
                'total_days_with_records' => count($attendanceReport['rows']),
                'total_punches' => $attendanceReport['total_punches'],
                'total_manual_entries' => $attendanceReport['total_manual_entries'],
            ],
        ];
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  \Illuminate\Database\Eloquent\Builder<TModel>  $query
     * @param  callable(TModel): array<string, mixed>  $mapper
     * @return list<array<string, mixed>>
     */
    private function recentRequests($query, callable $mapper): array
    {
        return $query
            ->get()
            ->map(static fn ($model): array => $mapper($model))
            ->values()
            ->all();
    }
}
