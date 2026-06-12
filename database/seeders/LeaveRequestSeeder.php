<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Carbon\CarbonInterface;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Date;

class LeaveRequestSeeder extends Seeder
{
    public function run(): void
    {
        $this->assignDepartmentManagers();

        $employees = Employee::query()
            ->whereIn('employee_code', [
                'EMP-DEMO-001',
                'EMP-DEMO-002',
                'EMP-DEMO-003',
                'EMP-DEMO-004',
                'EMP-DEMO-005',
                'EMP-DEMO-006',
                'EMP-DEMO-007',
                'EMP-DEMO-008',
                'EMP-DEMO-009',
                'EMP-DEMO-010',
                'EMP-DEMO-011',
                'EMP-DEMO-012',
            ])
            ->get()
            ->keyBy('employee_code');

        if ($employees->isEmpty()) {
            $employees = Employee::query()->limit(12)->get()->keyBy('employee_code');
        }

        if ($employees->isEmpty()) {
            return;
        }

        $approver = $employees['EMP-DEMO-002'] ?? Employee::query()->first();

        $requests = [
            // Draft — editable, not yet submitted
            [
                'code' => 'LV-DEMO-001',
                'employee_code' => 'EMP-DEMO-007',
                'status' => 'draft',
                'absence_types' => ['Annual Leave'],
                'period_from' => '+14 days',
                'period_to' => '+18 days',
                'days' => 5.0,
                'remarks' => 'Family visit — draft, not submitted yet.',
            ],
            [
                'code' => 'LV-DEMO-002',
                'employee_code' => 'EMP-DEMO-009',
                'status' => 'draft',
                'absence_types' => ['Sick Leave'],
                'period_from' => '+3 days',
                'period_to' => '+3 days',
                'days' => 1.0,
                'start_day_type' => 'full',
                'end_day_type' => 'full',
                'remarks' => 'Medical appointment — still in draft.',
            ],
            [
                'code' => 'LV-DEMO-003',
                'employee_code' => 'EMP-DEMO-010',
                'status' => 'draft',
                'absence_types' => ['Personal Leave'],
                'period_from' => '+21 days',
                'period_to' => '+22 days',
                'days' => 2.0,
                'remarks' => 'Personal matter — awaiting employee signature.',
            ],
            // Submitted — pending manager / HR approval
            [
                'code' => 'LV-DEMO-004',
                'employee_code' => 'EMP-DEMO-007',
                'status' => 'submitted',
                'absence_types' => ['Annual Leave'],
                'period_from' => '+7 days',
                'period_to' => '+11 days',
                'days' => 5.0,
                'remarks' => 'Submitted — waiting for approval.',
            ],
            [
                'code' => 'LV-DEMO-005',
                'employee_code' => 'EMP-DEMO-008',
                'status' => 'submitted',
                'absence_types' => ['Casual Leave'],
                'period_from' => '+5 days',
                'period_to' => '+5 days',
                'days' => 1.0,
                'remarks' => 'Short casual leave — submitted.',
            ],
            [
                'code' => 'LV-DEMO-006',
                'employee_code' => 'EMP-DEMO-011',
                'status' => 'submitted',
                'absence_types' => ['Annual Leave'],
                'period_from' => '+10 days',
                'period_to' => '+14 days',
                'days' => 5.0,
                'start_day_type' => 'half',
                'end_day_type' => 'full',
                'remarks' => 'Partial start day — submitted for review.',
            ],
            [
                'code' => 'LV-DEMO-007',
                'employee_code' => 'EMP-DEMO-004',
                'status' => 'submitted',
                'absence_types' => ['Emergency Leave'],
                'period_from' => '+2 days',
                'period_to' => '+4 days',
                'days' => 3.0,
                'remarks' => 'Urgent family emergency — submitted.',
            ],
            // Approved — decided, visible on leave calendar
            [
                'code' => 'LV-DEMO-008',
                'employee_code' => 'EMP-DEMO-003',
                'status' => 'approved',
                'absence_types' => ['Annual Leave'],
                'period_from' => '+30 days',
                'period_to' => '+34 days',
                'days' => 5.0,
                'remarks' => 'Planned annual leave.',
                'decision_remarks' => 'Approved. Enjoy your leave.',
                'decided_days_ago' => 2,
            ],
            [
                'code' => 'LV-DEMO-009',
                'employee_code' => 'EMP-DEMO-006',
                'status' => 'approved',
                'absence_types' => ['Sick Leave'],
                'period_from' => '-5 days',
                'period_to' => '-3 days',
                'days' => 3.0,
                'remarks' => 'Recovered from flu.',
                'decision_remarks' => 'Approved with medical note on file.',
                'decided_days_ago' => 7,
            ],
            [
                'code' => 'LV-DEMO-010',
                'employee_code' => 'EMP-DEMO-012',
                'status' => 'approved',
                'absence_types' => ['Annual Leave'],
                'period_from' => '+45 days',
                'period_to' => '+52 days',
                'days' => 6.0,
                'remarks' => 'Summer break.',
                'decision_remarks' => 'Approved — coverage arranged with team.',
                'decided_days_ago' => 1,
            ],
            [
                'code' => 'LV-DEMO-011',
                'employee_code' => 'EMP-DEMO-001',
                'status' => 'approved',
                'absence_types' => ['Personal Leave'],
                'period_from' => '-14 days',
                'period_to' => '-12 days',
                'days' => 3.0,
                'remarks' => 'Personal travel.',
                'decision_remarks' => 'Approved.',
                'decided_days_ago' => 10,
            ],
            // Rejected — decided with remarks
            [
                'code' => 'LV-DEMO-012',
                'employee_code' => 'EMP-DEMO-005',
                'status' => 'rejected',
                'absence_types' => ['Annual Leave'],
                'period_from' => '+8 days',
                'period_to' => '+15 days',
                'days' => 6.0,
                'remarks' => 'Requested during campaign launch.',
                'decision_remarks' => 'Rejected — critical marketing launch week. Please reschedule.',
                'decided_days_ago' => 3,
            ],
            [
                'code' => 'LV-DEMO-013',
                'employee_code' => 'EMP-DEMO-010',
                'status' => 'rejected',
                'absence_types' => ['Casual Leave'],
                'period_from' => '+1 days',
                'period_to' => '+2 days',
                'days' => 2.0,
                'remarks' => 'Casual leave request.',
                'decision_remarks' => 'Rejected — minimum staffing required in Operations.',
                'decided_days_ago' => 1,
            ],
            [
                'code' => 'LV-DEMO-014',
                'employee_code' => 'EMP-DEMO-009',
                'status' => 'rejected',
                'absence_types' => ['Emergency Leave'],
                'period_from' => '-2 days',
                'period_to' => '-1 days',
                'days' => 2.0,
                'remarks' => 'Emergency request without documentation.',
                'decision_remarks' => 'Rejected — please submit supporting documents and re-apply.',
                'decided_days_ago' => 5,
            ],
            // Extra mix for list filters
            [
                'code' => 'LV-DEMO-015',
                'employee_code' => 'EMP-DEMO-008',
                'status' => 'approved',
                'absence_types' => ['Maternity Leave'],
                'period_from' => '+60 days',
                'period_to' => '+120 days',
                'days' => 45.0,
                'remarks' => 'Maternity leave plan.',
                'decision_remarks' => 'Approved per HR policy.',
                'decided_days_ago' => 4,
            ],
            [
                'code' => 'LV-DEMO-016',
                'employee_code' => 'EMP-DEMO-011',
                'status' => 'draft',
                'absence_types' => ['Unpaid Leave'],
                'period_from' => '+90 days',
                'period_to' => '+100 days',
                'days' => 11.0,
                'remarks' => 'Extended unpaid leave — draft.',
            ],
            [
                'code' => 'LV-DEMO-017',
                'employee_code' => 'EMP-DEMO-004',
                'status' => 'submitted',
                'absence_types' => ['Sick Leave'],
                'period_from' => 'today',
                'period_to' => 'today',
                'days' => 1.0,
                'remarks' => 'Not feeling well — submitted today.',
            ],
            [
                'code' => 'LV-DEMO-018',
                'employee_code' => 'EMP-DEMO-003',
                'status' => 'submitted',
                'absence_types' => ['Annual Leave'],
                'period_from' => '+20 days',
                'period_to' => '+24 days',
                'days' => 5.0,
                'remarks' => 'Engineering team offsite conflict check.',
            ],
        ];

        foreach ($requests as $row) {
            $employee = $employees[$row['employee_code']] ?? null;

            if ($employee === null) {
                continue;
            }

            $periodFrom = $this->resolveDate($row['period_from']);
            $periodTo = $this->resolveDate($row['period_to']);
            $requestDate = $periodFrom->copy()->subDay()->format('Y-m-d');

            $attributes = [
                'employee_id' => $employee->id,
                'department_id' => $employee->department_id,
                'absence_types' => $row['absence_types'],
                'absence_other' => $row['absence_other'] ?? null,
                'details' => $row['details'] ?? null,
                'date' => $requestDate,
                'period_from' => $periodFrom->format('Y-m-d'),
                'period_to' => $periodTo->format('Y-m-d'),
                'start_day_type' => $row['start_day_type'] ?? 'full',
                'end_day_type' => $row['end_day_type'] ?? 'full',
                'days' => $row['days'],
                'remarks' => $row['remarks'] ?? null,
                'status' => $row['status'],
                'decision_remarks' => null,
                'decided_at' => null,
                'approved_by_employee_id' => null,
            ];

            if (in_array($row['status'], ['approved', 'rejected'], true)) {
                $decidedDaysAgo = $row['decided_days_ago'] ?? 1;
                $attributes['decision_remarks'] = $row['decision_remarks'] ?? null;
                $attributes['decided_at'] = now()->subDays($decidedDaysAgo);
                $attributes['approved_by_employee_id'] = $approver?->id;
            }

            LeaveRequest::query()->updateOrCreate(
                ['code' => $row['code']],
                $attributes,
            );
        }

        $this->seedTomorrowApprovedLeaves();
    }

    /**
     * Twenty employees on approved leave tomorrow (for calendar / staffing checks).
     */
    private function seedTomorrowApprovedLeaves(): void
    {
        $tomorrow = now()->addDay()->startOfDay();
        $tomorrowDate = $tomorrow->format('Y-m-d');
        $requestDate = now()->startOfDay()->format('Y-m-d');

        $employees = Employee::query()
            ->whereHas('user', fn ($query) => $query->where('is_active', true))
            ->orderBy('department_id')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->limit(20)
            ->get();

        if ($employees->count() < 20) {
            $existingIds = $employees->pluck('id');
            $extra = Employee::query()
                ->when($existingIds->isNotEmpty(), fn ($query) => $query->whereNotIn('id', $existingIds))
                ->orderBy('id')
                ->limit(20 - $employees->count())
                ->get();
            $employees = $employees->concat($extra)->take(20);
        }

        if ($employees->isEmpty()) {
            return;
        }

        $approver = Employee::query()
            ->where('employee_code', 'EMP-DEMO-002')
            ->first()
            ?? $employees->first();

        $leaveTypes = [
            'Annual Leave',
            'Sick Leave',
            'Personal Leave',
            'Casual Leave',
            'Emergency Leave',
        ];

        foreach ($employees->values() as $index => $employee) {
            $sequence = str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT);

            LeaveRequest::query()->updateOrCreate(
                ['code' => 'LV-TMR-'.$sequence],
                [
                    'employee_id' => $employee->id,
                    'department_id' => $employee->department_id,
                    'absence_types' => [$leaveTypes[$index % count($leaveTypes)]],
                    'absence_other' => null,
                    'details' => null,
                    'date' => $requestDate,
                    'period_from' => $tomorrowDate,
                    'period_to' => $tomorrowDate,
                    'start_day_type' => 'full',
                    'end_day_type' => 'full',
                    'days' => 1.0,
                    'remarks' => 'Approved leave for tomorrow — demo seed.',
                    'status' => 'approved',
                    'decision_remarks' => 'Approved for staffing demo.',
                    'decided_at' => now(),
                    'approved_by_employee_id' => $approver?->id,
                ],
            );
        }
    }

    private function assignDepartmentManagers(): void
    {
        $managers = [
            'OPS' => 'EMP-DEMO-001',
            'HR' => 'EMP-DEMO-002',
            'ENG' => 'EMP-DEMO-003',
            'FIN' => 'EMP-DEMO-004',
            'MKT' => 'EMP-DEMO-005',
            'SAL' => 'EMP-DEMO-006',
        ];

        $employees = Employee::query()
            ->whereIn('employee_code', array_values($managers))
            ->pluck('id', 'employee_code');

        foreach ($managers as $departmentCode => $managerCode) {
            $managerId = $employees[$managerCode] ?? null;

            if ($managerId === null) {
                continue;
            }

            Department::query()
                ->where('code', $departmentCode)
                ->update(['manager_employee_id' => $managerId]);
        }
    }

    private function resolveDate(string $expression): CarbonInterface
    {
        return match ($expression) {
            'today' => now()->startOfDay(),
            'tomorrow' => now()->addDay()->startOfDay(),
            default => str_starts_with($expression, '+') || str_starts_with($expression, '-')
                ? now()->startOfDay()->modify($expression)
                : Date::parse($expression),
        };
    }
}
