<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use App\Models\LeaveRequest;
use App\Models\WorkTimetable;
use Database\Seeders\DemoEmployeeSeeder;
use Database\Seeders\DepartmentSeeder;
use Database\Seeders\JobPositionSeeder;
use Database\Seeders\LeaveRequestSeeder;
use Database\Seeders\LeaveTypeSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\WorkTimetableSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveRequestSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_leave_request_seeder_creates_requests_in_all_workflow_statuses(): void
    {
        $this->seed([
            RoleSeeder::class,
            DepartmentSeeder::class,
            JobPositionSeeder::class,
            LeaveTypeSeeder::class,
            WorkTimetableSeeder::class,
            DemoEmployeeSeeder::class,
        ]);

        $departmentId = Department::query()->value('id');
        $jobPositionId = JobPosition::query()->value('id');
        $workTimetableId = WorkTimetable::query()->value('id');

        if (Employee::query()->count() < 20) {
            Employee::factory()
                ->count(20 - Employee::query()->count())
                ->create([
                    'department_id' => $departmentId,
                    'job_position_id' => $jobPositionId,
                    'work_timetable_id' => $workTimetableId,
                ]);
        }

        $this->seed(LeaveRequestSeeder::class);

        $this->assertDatabaseHas('leave_requests', ['code' => 'LV-DEMO-001', 'status' => 'draft']);
        $this->assertDatabaseHas('leave_requests', ['code' => 'LV-DEMO-004', 'status' => 'submitted']);
        $this->assertDatabaseHas('leave_requests', ['code' => 'LV-DEMO-008', 'status' => 'approved']);
        $this->assertDatabaseHas('leave_requests', ['code' => 'LV-DEMO-012', 'status' => 'rejected']);

        $this->assertGreaterThanOrEqual(3, LeaveRequest::query()->where('status', 'draft')->count());
        $this->assertGreaterThanOrEqual(4, LeaveRequest::query()->where('status', 'submitted')->count());
        $this->assertGreaterThanOrEqual(4, LeaveRequest::query()->where('status', 'approved')->count());
        $this->assertGreaterThanOrEqual(3, LeaveRequest::query()->where('status', 'rejected')->count());

        $tomorrow = now()->addDay()->format('Y-m-d');
        $this->assertSame(
            20,
            LeaveRequest::query()
                ->where('status', 'approved')
                ->where('period_from', $tomorrow)
                ->where('period_to', $tomorrow)
                ->where('code', 'like', 'LV-TMR-%')
                ->count(),
        );
    }
}
