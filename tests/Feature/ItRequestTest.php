<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\ItRequest;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs(User::factory()->create([
            'email_verified_at' => now(),
        ]));
    }

    public function test_store_creates_it_request_with_date(): void
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);

        $data = [
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-02-17',
        ];

        $response = $this->post(route('it-requests.store'), $data);

        $itRequest = ItRequest::firstOrFail();

        $response->assertRedirect(route('it-requests.show', $itRequest));
        $this->assertDatabaseHas('it_requests', [
            'id' => $itRequest->id,
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-02-17',
            'status' => 'draft',
        ]);
    }

    public function test_submit_sets_status_to_submitted_when_draft(): void
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);

        $itRequest = ItRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-02-17',
            'status' => 'draft',
        ]);

        $response = $this->from(route('it-requests.show', $itRequest))
            ->post(route('it-requests.submit', $itRequest));

        $response->assertRedirect(route('it-requests.index'));
        $response->assertSessionHas('success');
        $this->assertSame('submitted', $itRequest->fresh()->status);
    }

    public function test_submit_fails_when_not_draft(): void
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);

        $itRequest = ItRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-02-17',
            'status' => 'submitted',
        ]);

        $response = $this->from(route('it-requests.show', $itRequest))
            ->post(route('it-requests.submit', $itRequest));

        $response->assertRedirect(route('it-requests.show', $itRequest));
        $response->assertSessionHas('error');
        $this->assertSame('submitted', $itRequest->fresh()->status);
    }

    public function test_print_renders_printable_page(): void
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);

        $itRequest = ItRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-02-17',
            'status' => 'submitted',
        ]);

        $response = $this->get(route('it-requests.print', $itRequest));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('it-requests/print')
            ->has('itRequest')
            ->has('companyLogoUrl')
        );
    }
}
