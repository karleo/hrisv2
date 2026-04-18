<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeRequest;
use App\Models\EmployeeRequestActivityLog;
use App\Models\ItAssetRequest;
use App\Models\JobPosition;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
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

    public function test_employee_request_store_returns_validation_errors_when_mandatory_fields_missing(): void
    {
        $response = $this->from(route('employee-requests.create'))
            ->post(route('employee-requests.store'), []);

        $response->assertSessionHasErrors([
            'employee_id',
            'job_position_id',
            'department_id',
            'date',
            'date_of_joining',
        ]);
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

    public function test_employee_request_creation_writes_audit_log_rows(): void
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

        $this->assertDatabaseHas('employee_request_activity_logs', [
            'employee_request_id' => $employeeRequest->id,
            'action' => EmployeeRequestActivityLog::ACTION_CREATED,
            'field_name' => 'status',
            'new_value' => 'draft',
        ]);
    }

    public function test_employee_request_update_writes_activity_log_for_changed_fields(): void
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
            'bag_allowance' => null,
        ]);

        $employeeRequest->update([
            'status' => 'submitted',
            'bag_allowance' => '2 bags',
        ]);

        $this->assertDatabaseHas('employee_request_activity_logs', [
            'employee_request_id' => $employeeRequest->id,
            'action' => EmployeeRequestActivityLog::ACTION_UPDATED,
            'field_name' => 'status',
            'old_value' => 'draft',
            'new_value' => 'submitted',
        ]);
        $this->assertDatabaseHas('employee_request_activity_logs', [
            'employee_request_id' => $employeeRequest->id,
            'action' => EmployeeRequestActivityLog::ACTION_UPDATED,
            'field_name' => 'bag_allowance',
            'old_value' => null,
            'new_value' => '2 bags',
        ]);
    }

    public function test_employee_request_store_persists_employee_signature_from_data_url(): void
    {
        Storage::fake('public');

        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);
        $jobPosition = JobPosition::factory()->create();

        $onePixelPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        $payload = [
            'employee_id' => $employee->id,
            'job_position_id' => $jobPosition->id,
            'department_id' => $department->id,
            'date' => '2026-04-01',
            'date_of_joining' => '2026-04-15',
            'employee_signature_data_url' => 'data:image/png;base64,'.$onePixelPngBase64,
        ];

        $response = $this->post(route('employee-requests.store'), $payload);

        $employeeRequest = EmployeeRequest::firstOrFail();

        $response->assertRedirect(route('employee-requests.show', $employeeRequest));
        $this->assertNotNull($employeeRequest->fresh()->employee_signature);
        Storage::disk('public')->assertExists($employeeRequest->fresh()->employee_signature);
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
