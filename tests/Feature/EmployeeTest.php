<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
    }

    public function test_index_displays_employees(): void
    {
        Employee::factory()->count(3)->create();

        $response = $this->get(route('employees.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/index')
            ->has('employees')
            ->has('employees.data', 3)
        );
    }

    public function test_create_displays_form(): void
    {
        $response = $this->get(route('employees.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/create')
            ->has('departments')
            ->has('jobPositions')
        );
    }

    public function test_store_creates_employee(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();

        $data = [
            'employee_code' => 'EMP-0001',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email_address' => 'john.doe@example.com',
            'contact_number' => '+1 234 567 8900',
            'address_1' => '123 Main St',
            'address_2' => 'Apt 4',
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
        ];

        $response = $this->post(route('employees.store'), $data);

        $response->assertRedirect(route('employees.index'));
        $this->assertDatabaseHas('employees', $data);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->post(route('employees.store'), []);

        $response->assertSessionHasErrors([
            'employee_code',
            'first_name',
            'last_name',
            'email_address',
            'department_id',
            'job_position_id',
        ]);
    }

    public function test_store_validates_unique_employee_code(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        Employee::factory()->create(['employee_code' => 'EMP-0001']);

        $response = $this->post(route('employees.store'), [
            'employee_code' => 'EMP-0001',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email_address' => 'jane.doe@example.com',
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
        ]);

        $response->assertSessionHasErrors(['employee_code']);
    }

    public function test_store_validates_unique_email_address(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        Employee::factory()->create(['email_address' => 'same@example.com']);

        $response = $this->post(route('employees.store'), [
            'employee_code' => 'EMP-0002',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email_address' => 'same@example.com',
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
        ]);

        $response->assertSessionHasErrors(['email_address']);
    }

    public function test_edit_displays_form(): void
    {
        $employee = Employee::factory()->create();

        $response = $this->get(route('employees.edit', $employee));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/edit')
            ->has('employee')
            ->has('departments')
            ->has('jobPositions')
            ->where('employee.id', $employee->id)
        );
    }

    public function test_update_modifies_employee(): void
    {
        $employee = Employee::factory()->create([
            'employee_code' => 'EMP-0001',
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();

        $data = [
            'employee_code' => 'EMP-0002',
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email_address' => 'jane.smith@example.com',
            'contact_number' => null,
            'address_1' => '456 Oak Ave',
            'address_2' => null,
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
        ];

        $response = $this->patch(route('employees.update', $employee), $data);

        $response->assertRedirect(route('employees.index'));
        $this->assertDatabaseHas('employees', array_merge($data, ['id' => $employee->id]));
    }

    public function test_update_validates_unique_employee_code_excluding_current(): void
    {
        $employee = Employee::factory()->create(['employee_code' => 'EMP-0001']);
        Employee::factory()->create(['employee_code' => 'EMP-0002']);

        $response = $this->patch(route('employees.update', $employee), [
            'employee_code' => 'EMP-0002',
            'first_name' => $employee->first_name,
            'last_name' => $employee->last_name,
            'email_address' => $employee->email_address,
            'department_id' => $employee->department_id,
            'job_position_id' => $employee->job_position_id,
        ]);

        $response->assertSessionHasErrors(['employee_code']);
    }

    public function test_destroy_deletes_employee(): void
    {
        $employee = Employee::factory()->create();

        $response = $this->delete(route('employees.destroy', $employee));

        $response->assertRedirect(route('employees.index'));
        $this->assertDatabaseMissing('employees', ['id' => $employee->id]);
    }

    public function test_employees_require_authentication(): void
    {
        $this->post(route('logout'));

        $this->get(route('employees.index'))->assertRedirect();
        $this->get(route('employees.create'))->assertRedirect();
        $this->post(route('employees.store'), [])->assertRedirect();
    }
}
