<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeRequest;
use App\Models\ItRequest;
use App\Models\JobPosition;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RequestSignaturesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_user_can_update_it_request_signature(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->create());

        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);

        $itRequest = ItRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-03-24',
            'status' => 'submitted',
        ]);

        $response = $this->post(route('it-requests.signatures.update', $itRequest), [
            'employee_signature' => UploadedFile::fake()->create('employee-signature.png', 50, 'image/png'),
        ]);

        $response->assertRedirect();

        $itRequest->refresh();
        $this->assertNotNull($itRequest->employee_signature);
        Storage::disk('public')->assertExists($itRequest->employee_signature);
    }

    public function test_user_can_update_employee_request_signature(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->create());

        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);
        $jobPosition = JobPosition::factory()->create();

        $employeeRequest = EmployeeRequest::query()->create([
            'employee_id' => $employee->id,
            'job_position_id' => $jobPosition->id,
            'department_id' => $department->id,
            'date' => '2026-03-24',
            'date_of_joining' => '2026-03-24',
            'status' => 'submitted',
        ]);

        $response = $this->post(route('employee-requests.signatures.update', $employeeRequest), [
            'employee_signature' => UploadedFile::fake()->create('employee-signature.png', 50, 'image/png'),
        ]);

        $response->assertRedirect();

        $employeeRequest->refresh();
        $this->assertNotNull($employeeRequest->employee_signature);
        Storage::disk('public')->assertExists($employeeRequest->employee_signature);
    }

    public function test_user_can_update_ceo_signature_on_employee_request(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->create());

        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);
        $jobPosition = JobPosition::factory()->create();

        $employeeRequest = EmployeeRequest::query()->create([
            'employee_id' => $employee->id,
            'job_position_id' => $jobPosition->id,
            'department_id' => $department->id,
            'date' => '2026-03-24',
            'date_of_joining' => '2026-03-24',
            'status' => 'submitted',
        ]);

        $response = $this->post(route('employee-requests.signatures.update', $employeeRequest), [
            'ceo_signature' => UploadedFile::fake()->create('ceo-signature.png', 50, 'image/png'),
        ]);

        $response->assertRedirect();

        $employeeRequest->refresh();
        $this->assertNotNull($employeeRequest->ceo_signature);
        Storage::disk('public')->assertExists($employeeRequest->ceo_signature);
    }

    public function test_user_can_update_leave_request_signature(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->create());

        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
        ]);

        $response = $this->post(route('leave-requests.signatures.update', $leaveRequest), [
            'employee_signature' => UploadedFile::fake()->image('employee-signature.png', 240, 48),
        ]);

        $response->assertRedirect();

        $leaveRequest->refresh();
        $this->assertNotNull($leaveRequest->employee_signature);
        Storage::disk('public')->assertExists($leaveRequest->employee_signature);
    }

    public function test_leave_request_show_exposes_host_relative_signature_url(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->create());

        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'absence_types' => ['Annual Leave'],
        ]);

        $relativePath = 'leave-requests/'.$leaveRequest->id.'/signatures/test.png';
        Storage::disk('public')->put($relativePath, 'fake-png');
        $leaveRequest->update(['employee_signature' => $relativePath]);
        $leaveRequest->refresh();

        $response = $this->get(route('leave-requests.show', $leaveRequest));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('leaveRequest.employee_signature_url', '/storage/'.$leaveRequest->employee_signature)
        );
    }
}
