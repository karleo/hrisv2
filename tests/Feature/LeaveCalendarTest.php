<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveCalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_cannot_access_leave_calendar_page(): void
    {
        $role = Role::factory()->create([
            'name' => 'Employee',
            'slug' => 'employee-basic',
        ]);

        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        Employee::factory()->create([
            'user_id' => $user->id,
        ]);

        $this->actingAs($user)
            ->get(route('leave-calendar.index'))
            ->assertForbidden();
    }

    public function test_administrator_can_access_leave_calendar_page(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        LeaveType::factory()->create([
            'name' => 'Annual Leave',
            'leave_category' => 'paid',
        ]);

        $employee = Employee::factory()->create();
        LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $employee->department_id,
            'absence_types' => ['Annual Leave'],
            'status' => 'approved',
            'period_from' => now()->startOfMonth()->toDateString(),
            'period_to' => now()->startOfMonth()->addDay()->toDateString(),
            'days' => 2,
        ]);

        $this->actingAs($user)
            ->get(route('leave-calendar.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('leave-calendar/index')
                ->has('entries')
                ->has('calendarDayCounts')
                ->has('calendarDayLeaves')
                ->has('todayOnLeave')
                ->has('upcomingLeaves')
                ->has('departmentSummary')
            );
    }

    public function test_calendar_day_leaves_include_employee_names_for_each_date(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        LeaveType::factory()->create([
            'name' => 'Annual Leave',
            'leave_category' => 'paid',
        ]);

        $employee = Employee::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Doe',
        ]);
        $leaveDate = now()->startOfMonth()->toDateString();

        LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $employee->department_id,
            'absence_types' => ['Annual Leave'],
            'status' => 'approved',
            'period_from' => $leaveDate,
            'period_to' => $leaveDate,
            'days' => 1,
        ]);

        $this->actingAs($user)
            ->get(route('leave-calendar.index', ['month' => now()->format('Y-m')]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has("calendarDayLeaves.{$leaveDate}", 1)
                ->where("calendarDayLeaves.{$leaveDate}.0.employee_name", 'Jane Doe')
                ->where("calendarDayLeaves.{$leaveDate}.0.leave_type", 'Annual Leave')
            );
    }

    public function test_manager_sees_only_managed_departments_in_leave_calendar(): void
    {
        LeaveType::factory()->create([
            'name' => 'Annual Leave',
            'leave_category' => 'paid',
        ]);

        $managerRole = Role::factory()->create([
            'name' => 'Manager',
            'slug' => 'manager',
        ]);

        $managerUser = User::factory()->create([
            'role_id' => $managerRole->id,
            'email_verified_at' => now(),
        ]);
        $managerEmployee = Employee::factory()->create([
            'user_id' => $managerUser->id,
        ]);

        $managedDepartment = Department::factory()->create([
            'manager_employee_id' => $managerEmployee->id,
        ]);
        $otherDepartment = Department::factory()->create();

        $managedEmployee = Employee::factory()->create([
            'department_id' => $managedDepartment->id,
        ]);
        $otherEmployee = Employee::factory()->create([
            'department_id' => $otherDepartment->id,
        ]);

        LeaveRequest::factory()->create([
            'employee_id' => $managedEmployee->id,
            'department_id' => $managedDepartment->id,
            'absence_types' => ['Annual Leave'],
            'status' => 'approved',
            'period_from' => now()->startOfMonth()->toDateString(),
            'period_to' => now()->startOfMonth()->addDay()->toDateString(),
            'days' => 2,
        ]);
        LeaveRequest::factory()->create([
            'employee_id' => $otherEmployee->id,
            'department_id' => $otherDepartment->id,
            'absence_types' => ['Annual Leave'],
            'status' => 'approved',
            'period_from' => now()->startOfMonth()->addDays(2)->toDateString(),
            'period_to' => now()->startOfMonth()->addDays(3)->toDateString(),
            'days' => 2,
        ]);

        $this->actingAs($managerUser)
            ->get(route('leave-calendar.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('leave-calendar/index')
                ->has('entries', 1)
                ->where('entries.0.department_name', $managedDepartment->name)
            );
    }
}
