<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeRequest;
use App\Models\ItAssetRequest;
use App\Models\JobPosition;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RequestDraftSubmitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs(User::factory()->create());
    }

    public function test_employee_request_store_creates_draft_and_redirects_to_show(): void
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);
        $jobPosition = JobPosition::factory()->create();

        $payload = [
            'employee_id' => $employee->id,
            'job_position_id' => $jobPosition->id,
            'department_id' => $department->id,
            'date' => '2026-04-01',
            'date_of_joining' => '2026-04-15',
        ];

        $response = $this->post(route('employee-requests.store'), $payload);

        $employeeRequest = EmployeeRequest::firstOrFail();

        $response->assertRedirect(route('employee-requests.show', $employeeRequest));
        $this->assertSame('draft', $employeeRequest->status);
    }

    public function test_employee_request_submit_sets_submitted_when_draft(): void
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);
        $jobPosition = JobPosition::factory()->create();

        $employeeRequest = EmployeeRequest::query()->create([
            'employee_id' => $employee->id,
            'job_position_id' => $jobPosition->id,
            'department_id' => $department->id,
            'date' => '2026-04-01',
            'date_of_joining' => '2026-04-15',
            'status' => 'draft',
        ]);

        $response = $this->from(route('employee-requests.show', $employeeRequest))
            ->post(route('employee-requests.submit', $employeeRequest));

        $response->assertRedirect(route('employee-requests.index'));
        $response->assertSessionHas('success');
        $this->assertSame('submitted', $employeeRequest->fresh()->status);
    }

    public function test_employee_request_print_renders_printable_page(): void
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);
        $jobPosition = JobPosition::factory()->create();

        $employeeRequest = EmployeeRequest::query()->create([
            'employee_id' => $employee->id,
            'job_position_id' => $jobPosition->id,
            'department_id' => $department->id,
            'date' => '2026-04-01',
            'date_of_joining' => '2026-04-15',
            'status' => 'draft',
        ]);

        $response = $this->get(route('employee-requests.print', $employeeRequest));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employee-requests/print')
            ->has('employeeRequest')
            ->has('companyLogoUrl')
            ->where('employeeRequest.code', $employeeRequest->code)
        );
    }

    public function test_it_asset_request_store_creates_draft_and_redirects_to_show(): void
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);

        $payload = [
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-04-01',
        ];

        $response = $this->post(route('it-asset-requests.store'), $payload);

        $itAssetRequest = ItAssetRequest::firstOrFail();

        $response->assertRedirect(route('it-asset-requests.show', $itAssetRequest));
        $this->assertSame('draft', $itAssetRequest->status);
    }

    public function test_it_asset_request_submit_sets_submitted_when_draft(): void
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);

        $itAssetRequest = ItAssetRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-04-01',
            'status' => 'draft',
        ]);

        $response = $this->from(route('it-asset-requests.show', $itAssetRequest))
            ->post(route('it-asset-requests.submit', $itAssetRequest));

        $response->assertRedirect(route('it-asset-requests.index'));
        $response->assertSessionHas('success');
        $this->assertSame('submitted', $itAssetRequest->fresh()->status);
    }
}
