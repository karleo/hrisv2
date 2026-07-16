<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeRequest;
use App\Models\ItRequest;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RequestDecisionNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    /**
     * @return array{0: Department, 1: Employee, 2: User}
     */
    private function departmentEmployeeAndRequester(): array
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
            'leave_opening_balance' => 30,
        ]);
        $requesterUser = User::factory()->create();
        $employee->update(['user_id' => $requesterUser->id]);

        return [$department, $employee, $requesterUser];
    }

    public function test_leave_request_approval_notifies_employee_with_decision_payload(): void
    {
        [$department, $employee, $requesterUser] = $this->departmentEmployeeAndRequester();

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
            'status' => 'submitted',
        ]);
        $leaveRequest->update(['approved_by_signature' => 'leave-requests/'.$leaveRequest->id.'/signatures/manager.png']);

        $this->actingAs(User::factory()->create())
            ->post(route('leave-requests.decide', $leaveRequest), [
                'decision' => 'approved',
            ]);

        $requesterUser->refresh();
        $this->assertCount(1, $requesterUser->notifications);
        $databaseNotification = $requesterUser->notifications->first();
        $this->assertNull($databaseNotification->read_at);
        $this->assertSame(1, $requesterUser->unreadNotifications()->count());
        /** @var array<string, mixed> $data */
        $data = $databaseNotification->data;
        $this->assertSame('approved', $data['decision'] ?? null);
        $this->assertSame('leave_request', $data['request_type'] ?? null);
        $this->assertArrayHasKey('employee_photo_url', $data);
        $this->assertNull($data['employee_photo_url']);
    }

    public function test_leave_request_decision_notification_includes_approver_photo_when_linked(): void
    {
        [$department, $employee, $requesterUser] = $this->departmentEmployeeAndRequester();

        $approverUser = User::factory()->create();
        $approverEmployee = Employee::factory()->create([
            'department_id' => $department->id,
            'photo' => 'employees/approver/avatar.jpg',
        ]);
        $approverEmployee->update(['user_id' => $approverUser->id]);

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
            'status' => 'submitted',
        ]);
        $leaveRequest->update(['approved_by_signature' => 'leave-requests/'.$leaveRequest->id.'/signatures/manager.png']);

        $this->actingAs($approverUser)
            ->post(route('leave-requests.decide', $leaveRequest), [
                'decision' => 'approved',
            ]);

        $requesterUser->refresh();
        $this->assertCount(1, $requesterUser->notifications);
        /** @var array<string, mixed> $data */
        $data = $requesterUser->notifications->first()->data;
        $this->assertSame('/storage/employees/approver/avatar.jpg', $data['employee_photo_url']);
    }

    public function test_employee_request_approval_notifies_employee_with_decision_payload(): void
    {
        [$department, $employee, $requesterUser] = $this->departmentEmployeeAndRequester();

        $employeeRequest = EmployeeRequest::query()->create([
            'employee_id' => $employee->id,
            'job_position_id' => $employee->job_position_id,
            'department_id' => $department->id,
            'date' => '2026-04-10',
            'date_of_joining' => '2026-01-01',
            'status' => 'submitted',
        ]);
        $employeeRequest->update(['approved_by_signature' => 'employee-requests/'.$employeeRequest->id.'/signatures/manager.png']);

        $this->actingAs(User::factory()->create())
            ->post(route('employee-requests.decide', $employeeRequest), [
                'decision' => 'approved',
            ]);

        $requesterUser->refresh();
        $this->assertCount(1, $requesterUser->notifications);
        $databaseNotification = $requesterUser->notifications->first();
        $this->assertNull($databaseNotification->read_at);
        $this->assertSame(1, $requesterUser->unreadNotifications()->count());
        /** @var array<string, mixed> $data */
        $data = $databaseNotification->data;
        $this->assertSame('approved', $data['decision'] ?? null);
        $this->assertSame('employee_request', $data['request_type'] ?? null);
        $this->assertArrayHasKey('employee_photo_url', $data);
        $this->assertNull($data['employee_photo_url']);
    }

    public function test_it_request_approval_notifies_employee_with_decision_payload(): void
    {
        [$department, $employee, $requesterUser] = $this->departmentEmployeeAndRequester();

        $itRequest = ItRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-04-10',
            'status' => 'submitted',
        ]);
        $itRequest->update(['approved_by_signature' => 'it-requests/'.$itRequest->id.'/signatures/manager.png']);

        $this->actingAs(User::factory()->create())
            ->post(route('it-requests.decide', $itRequest), [
                'decision' => 'approved',
            ]);

        $requesterUser->refresh();
        $this->assertCount(1, $requesterUser->notifications);
        $databaseNotification = $requesterUser->notifications->first();
        $this->assertNull($databaseNotification->read_at);
        $this->assertSame(1, $requesterUser->unreadNotifications()->count());
        /** @var array<string, mixed> $data */
        $data = $databaseNotification->data;
        $this->assertSame('approved', $data['decision'] ?? null);
        $this->assertSame('it_request', $data['request_type'] ?? null);
        $this->assertArrayHasKey('employee_photo_url', $data);
        $this->assertNull($data['employee_photo_url']);
    }
}
