<?php

namespace Tests\Feature;

use App\Http\Middleware\EnforceModulePermissions;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RequestApprovalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->withoutMiddleware(EnforceModulePermissions::class);
    }

    private function nonAdminUser(array $attributes = []): User
    {
        $role = Role::factory()->create([
            'slug' => 'staff-'.uniqid('', true),
            'name' => 'Staff',
        ]);

        return User::factory()->create(array_merge([
            'role_id' => $role->id,
        ], $attributes));
    }

    public function test_department_manager_only_sees_department_requests(): void
    {
        $managerUser = $this->nonAdminUser();
        $managerEmployee = Employee::factory()->create(['user_id' => $managerUser->id]);

        $managedDepartment = Department::factory()->create([
            'manager_employee_id' => $managerEmployee->id,
        ]);
        $otherDepartment = Department::factory()->create();

        $visibleRequest = LeaveRequest::factory()->create([
            'department_id' => $managedDepartment->id,
            'employee_id' => Employee::factory()->create(['department_id' => $managedDepartment->id])->id,
        ]);
        LeaveRequest::factory()->create([
            'department_id' => $otherDepartment->id,
            'employee_id' => Employee::factory()->create(['department_id' => $otherDepartment->id])->id,
        ]);

        $this->actingAs($managerUser);
        $response = $this->get(route('leave-requests.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('leave-requests/index')
            ->has('leaveRequests.data', 1)
            ->where('leaveRequests.data.0.id', $visibleRequest->id)
        );
    }

    public function test_employee_cannot_open_other_department_leave_request(): void
    {
        $user = $this->nonAdminUser();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $otherRequest = LeaveRequest::factory()->create([
            'employee_id' => Employee::factory()->create()->id,
            'department_id' => Department::factory()->create()->id,
        ]);

        $this->assertNotSame($employee->id, $otherRequest->employee_id);

        $this->actingAs($user);
        $this->get(route('leave-requests.show', $otherRequest))
            ->assertForbidden();
    }

    public function test_submitting_request_creates_notifications_for_manager_and_hr(): void
    {
        $hrRole = Role::factory()->create([
            'slug' => 'hr',
            'name' => 'HR',
        ]);
        $hrUser = User::factory()->create(['role_id' => $hrRole->id]);

        $managerUser = $this->nonAdminUser();
        $managerEmployee = Employee::factory()->create(['user_id' => $managerUser->id]);

        $ownerUser = $this->nonAdminUser();
        $department = Department::factory()->create([
            'manager_employee_id' => $managerEmployee->id,
        ]);
        $ownerEmployee = Employee::factory()->create([
            'user_id' => $ownerUser->id,
            'department_id' => $department->id,
            'leave_opening_balance' => 30,
        ]);

        $request = LeaveRequest::factory()->create([
            'employee_id' => $ownerEmployee->id,
            'department_id' => $department->id,
            'status' => 'draft',
            'days' => 1,
        ]);

        $this->actingAs($ownerUser);
        $this->post(route('leave-requests.submit', $request))
            ->assertRedirect(route('leave-requests.index'));

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $hrUser->id,
        ]);
        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $managerUser->id,
        ]);
    }

    public function test_dashboard_pending_counts_are_scoped_for_manager(): void
    {
        $managerUser = $this->nonAdminUser();
        $managerEmployee = Employee::factory()->create(['user_id' => $managerUser->id]);
        $managedDepartment = Department::factory()->create([
            'manager_employee_id' => $managerEmployee->id,
        ]);
        $otherDepartment = Department::factory()->create();

        LeaveRequest::factory()->create([
            'department_id' => $managedDepartment->id,
            'employee_id' => Employee::factory()->create(['department_id' => $managedDepartment->id])->id,
            'status' => 'submitted',
        ]);
        LeaveRequest::factory()->create([
            'department_id' => $otherDepartment->id,
            'employee_id' => Employee::factory()->create(['department_id' => $otherDepartment->id])->id,
            'status' => 'submitted',
        ]);

        $this->actingAs($managerUser);
        $response = $this->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('pending.leave_requests', 1)
        );
    }
}

