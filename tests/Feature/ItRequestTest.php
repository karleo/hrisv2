<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\ItRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware();
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
            'status' => 'submitted',
        ];

        $response = $this->post(route('it-requests.store'), $data);

        $itRequest = ItRequest::firstOrFail();

        $response->assertRedirect(route('it-requests.show', $itRequest));
        $this->assertDatabaseHas('it_requests', [
            'id' => $itRequest->id,
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-02-17',
            'status' => 'submitted',
        ]);
    }
}
