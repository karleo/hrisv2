<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs(User::factory()->create());
    }

    protected function createEmployeeAndDepartment(): array
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);

        return [$employee, $department];
    }

    public function test_index_displays_leave_requests(): void
    {
        [$employee, $department] = $this->createEmployeeAndDepartment();

        LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
        ]);

        $response = $this->get(route('leave-requests.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('leave-requests/index')
            ->has('leaveRequests')
            ->has('leaveRequests.data', 1)
            ->has('stats')
            ->has('departments')
        );
    }

    public function test_index_filters_by_date_preset_on_created_at(): void
    {
        [$employee, $department] = $this->createEmployeeAndDepartment();

        $this->travelTo(Carbon::parse('2026-04-03 12:00:00', config('app.timezone')));

        $todayRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
            'created_at' => now(),
        ]);

        $yesterdayRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Sick Leave'],
            'created_at' => now()->subDay(),
        ]);

        $this->get(route('leave-requests.index', ['date_preset' => 'today']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('leave-requests/index')
                ->has('leaveRequests.data', 1)
                ->where('leaveRequests.data.0.id', $todayRequest->id)
            );

        $this->get(route('leave-requests.index', ['date_preset' => 'yesterday']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('leave-requests/index')
                ->has('leaveRequests.data', 1)
                ->where('leaveRequests.data.0.id', $yesterdayRequest->id)
            );
    }

    public function test_create_displays_form(): void
    {
        $this->createEmployeeAndDepartment();

        $response = $this->get(route('leave-requests.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('leave-requests/create')
            ->has('employees')
            ->has('departments')
        );
    }

    public function test_store_creates_leave_request(): void
    {
        [$employee, $department] = $this->createEmployeeAndDepartment();

        $data = [
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_type' => 'Annual Leave',
            'absence_other' => null,
        ];

        $response = $this->post(route('leave-requests.store'), $data);

        $leaveRequest = LeaveRequest::firstOrFail();

        $response->assertRedirect(route('leave-requests.show', $leaveRequest));
        $this->assertNotEmpty($leaveRequest->code);
        $this->assertMatchesRegularExpression('/^PRL-\d{4}-\d{4}$/', $leaveRequest->code);
        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveRequest->id,
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'status' => 'draft',
        ]);
    }

    public function test_submit_sets_status_to_submitted_when_draft(): void
    {
        [$employee, $department] = $this->createEmployeeAndDepartment();

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
            'status' => 'draft',
        ]);

        $response = $this->from(route('leave-requests.show', $leaveRequest))
            ->post(route('leave-requests.submit', $leaveRequest));

        $response->assertRedirect(route('leave-requests.index'));
        $response->assertSessionHas('success');
        $this->assertSame('submitted', $leaveRequest->fresh()->status);
    }

    public function test_submit_fails_when_not_draft(): void
    {
        [$employee, $department] = $this->createEmployeeAndDepartment();

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
            'status' => 'submitted',
        ]);

        $response = $this->from(route('leave-requests.show', $leaveRequest))
            ->post(route('leave-requests.submit', $leaveRequest));

        $response->assertRedirect(route('leave-requests.show', $leaveRequest));
        $response->assertSessionHas('error');
        $this->assertSame('submitted', $leaveRequest->fresh()->status);
    }

    public function test_store_requires_absence_types(): void
    {
        [$employee, $department] = $this->createEmployeeAndDepartment();

        $response = $this->post(route('leave-requests.store'), [
            'employee_id' => $employee->id,
            'department_id' => $department->id,
        ]);

        $response->assertSessionHasErrors(['absence_type']);
    }

    public function test_store_requires_absence_other_when_others_selected(): void
    {
        [$employee, $department] = $this->createEmployeeAndDepartment();

        $response = $this->post(route('leave-requests.store'), [
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_type' => 'Others',
        ]);

        $response->assertSessionHasErrors(['absence_other']);
    }

    public function test_destroy_deletes_leave_request(): void
    {
        [$employee, $department] = $this->createEmployeeAndDepartment();

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
        ]);

        $response = $this->delete(route('leave-requests.destroy', $leaveRequest));

        $response->assertRedirect(route('leave-requests.index'));
        $this->assertDatabaseMissing('leave_requests', ['id' => $leaveRequest->id]);
    }

    public function test_print_renders_printable_page(): void
    {
        [$employee, $department] = $this->createEmployeeAndDepartment();

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Personal Leave'],
            'date' => '2026-02-14',
            'period_from' => '2026-02-18',
            'period_to' => '2026-02-18',
            'days' => 1,
        ]);

        $response = $this->get(route('leave-requests.print', $leaveRequest));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('leave-requests/print')
            ->has('leaveRequest')
            ->has('companyLogoUrl')
            ->where('leaveRequest.code', $leaveRequest->code)
        );
    }
}
