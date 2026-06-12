<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeRequest;
use App\Models\ItAssetRequest;
use App\Models\ItRequest;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class RequestApprovalRequiresSignatureTest extends TestCase
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

    public function test_leave_request_cannot_be_approved_without_manager_signature(): void
    {
        [$department, $employee] = $this->departmentEmployeeAndRequester();

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
            'status' => 'submitted',
            'approved_by_signature' => null,
        ]);

        $this->actingAs(User::factory()->create())
            ->post(route('leave-requests.decide', $leaveRequest), [
                'decision' => 'approved',
            ])
            ->assertSessionHas('error')
            ->assertRedirect();

        $leaveRequest->refresh();
        $this->assertSame('submitted', strtolower((string) $leaveRequest->status));
    }

    public function test_it_request_cannot_be_approved_without_manager_signature(): void
    {
        [$department, $employee] = $this->departmentEmployeeAndRequester();

        $itRequest = ItRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-04-10',
            'status' => 'submitted',
            'approved_by_signature' => null,
        ]);

        $this->actingAs(User::factory()->create())
            ->post(route('it-requests.decide', $itRequest), [
                'decision' => 'approved',
            ])
            ->assertSessionHas('error')
            ->assertRedirect();

        $itRequest->refresh();
        $this->assertSame('submitted', strtolower((string) $itRequest->status));
    }

    public function test_employee_request_cannot_be_approved_without_manager_signature(): void
    {
        [$department, $employee] = $this->departmentEmployeeAndRequester();

        $employeeRequest = EmployeeRequest::query()->create([
            'employee_id' => $employee->id,
            'job_position_id' => $employee->job_position_id,
            'department_id' => $department->id,
            'date' => '2026-04-10',
            'date_of_joining' => '2026-01-01',
            'status' => 'submitted',
            'approved_by_signature' => null,
        ]);

        $this->actingAs(User::factory()->create())
            ->post(route('employee-requests.decide', $employeeRequest), [
                'decision' => 'approved',
            ])
            ->assertSessionHas('error')
            ->assertRedirect();

        $employeeRequest->refresh();
        $this->assertSame('submitted', strtolower((string) $employeeRequest->status));
    }

    public function test_it_asset_request_cannot_be_approved_without_issued_by_signature(): void
    {
        [$department, $employee] = $this->departmentEmployeeAndRequester();

        $itAssetRequest = ItAssetRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-04-10',
            'status' => 'submitted',
            'issued_by_signature' => null,
        ]);

        $this->actingAs(User::factory()->create())
            ->post(route('it-asset-requests.decide', $itAssetRequest), [
                'decision' => 'approved',
            ])
            ->assertSessionHas('error')
            ->assertRedirect();

        $itAssetRequest->refresh();
        $this->assertSame('submitted', strtolower((string) $itAssetRequest->status));
    }

    public function test_it_asset_request_cannot_be_approved_without_issued_by_employee(): void
    {
        [$department, $employee] = $this->departmentEmployeeAndRequester();

        $itAssetRequest = ItAssetRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-04-10',
            'status' => 'submitted',
            'issued_by_signature' => 'it-asset-requests/test/signatures/issued-by.png',
            'issued_by_employee_id' => null,
        ]);

        $this->actingAs(User::factory()->create())
            ->post(route('it-asset-requests.decide', $itAssetRequest), [
                'decision' => 'approved',
            ])
            ->assertSessionHas('error')
            ->assertRedirect();

        $itAssetRequest->refresh();
        $this->assertSame('submitted', strtolower((string) $itAssetRequest->status));
        $this->assertNull($itAssetRequest->issued_by_employee_id);
    }

    public function test_it_asset_request_approval_sets_issued_date(): void
    {
        Carbon::setTestNow('2026-05-11 14:15:00');
        [$department, $employee] = $this->departmentEmployeeAndRequester();
        $issuer = Employee::factory()->create();

        $itAssetRequest = ItAssetRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-04-10',
            'date_issued' => null,
            'status' => 'submitted',
            'issued_by_signature' => 'it-asset-requests/test/signatures/issued-by.png',
            'issued_by_employee_id' => $issuer->id,
        ]);

        $this->actingAs(User::factory()->create())
            ->post(route('it-asset-requests.decide', $itAssetRequest), [
                'decision' => 'approved',
            ])
            ->assertSessionMissing('error')
            ->assertRedirect();

        $itAssetRequest->refresh();
        $this->assertSame('approved', strtolower((string) $itAssetRequest->status));
        $this->assertSame('2026-05-11', $itAssetRequest->date_issued?->toDateString());

        Carbon::setTestNow();
    }

    public function test_leave_request_can_be_rejected_without_manager_signature(): void
    {
        [$department, $employee] = $this->departmentEmployeeAndRequester();

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
            'status' => 'submitted',
            'approved_by_signature' => null,
        ]);

        $this->actingAs(User::factory()->create())
            ->post(route('leave-requests.decide', $leaveRequest), [
                'decision' => 'rejected',
                'remarks' => 'Not enough coverage.',
            ])
            ->assertSessionMissing('error')
            ->assertRedirect();

        $leaveRequest->refresh();
        $this->assertSame('rejected', strtolower((string) $leaveRequest->status));
    }

    public function test_leave_request_cannot_be_approved_when_requested_days_exceed_available_balance(): void
    {
        [$department, $employee] = $this->departmentEmployeeAndRequester();
        $employee->update(['leave_opening_balance' => 2]);

        LeaveType::factory()->create([
            'name' => 'Annual Leave',
            'leave_category' => 'paid',
        ]);

        LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
            'status' => 'approved',
            'days' => 1,
        ]);

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
            'status' => 'submitted',
            'days' => 2,
            'approved_by_signature' => 'leave-requests/test/signatures/manager.png',
        ]);

        $this->actingAs(User::factory()->create())
            ->post(route('leave-requests.decide', $leaveRequest), [
                'decision' => 'approved',
            ])
            ->assertSessionHas('error')
            ->assertRedirect();

        $leaveRequest->refresh();
        $this->assertSame('submitted', strtolower((string) $leaveRequest->status));
    }

    public function test_unpaid_leave_can_be_approved_even_if_balance_is_not_enough(): void
    {
        [$department, $employee] = $this->departmentEmployeeAndRequester();
        $employee->update(['leave_opening_balance' => 1]);

        LeaveType::factory()->create([
            'name' => 'Unpaid Leave',
            'leave_category' => 'unpaid',
        ]);

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Unpaid Leave'],
            'status' => 'submitted',
            'days' => 5,
            'approved_by_signature' => 'leave-requests/test/signatures/manager.png',
        ]);

        $this->actingAs(User::factory()->create())
            ->post(route('leave-requests.decide', $leaveRequest), [
                'decision' => 'approved',
            ])
            ->assertSessionMissing('error')
            ->assertRedirect();

        $leaveRequest->refresh();
        $this->assertSame('approved', strtolower((string) $leaveRequest->status));
    }
}
