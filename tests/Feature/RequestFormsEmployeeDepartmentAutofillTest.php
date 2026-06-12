<?php

namespace Tests\Feature;

use App\Http\Middleware\EnforceModulePermissions;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeRequest;
use App\Models\ItAssetRequest;
use App\Models\ItRequest;
use App\Models\JobPosition;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RequestFormsEmployeeDepartmentAutofillTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->withoutMiddleware(EnforceModulePermissions::class);
        $this->actingAs(User::factory()->create([
            'email_verified_at' => now(),
        ]));
    }

    public function test_create_forms_include_employee_department_id_in_options(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
        ]);

        $this->get(route('it-requests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('it-requests/create')
                ->where('employees.0.id', $employee->id)
                ->where('employees.0.department_id', $department->id)
                ->where('defaultEmployeeId', null)
            );

        $this->get(route('it-asset-requests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('it-asset-requests/create')
                ->where('employees.0.id', $employee->id)
                ->where('employees.0.department_id', $department->id)
                ->where('defaultEmployeeId', null)
            );

        $this->get(route('employee-requests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('employee-requests/create')
                ->where('employees.0.id', $employee->id)
                ->where('employees.0.department_id', $department->id)
                ->where('employees.0.job_position_id', $jobPosition->id)
                ->where('defaultEmployeeId', null)
            );
    }

    public function test_create_forms_pass_default_employee_id_when_user_is_linked_to_employee(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
        ]);
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        $this->actingAs($user);

        $this->get(route('it-requests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('it-requests/create')
                ->where('defaultEmployeeId', $employee->id)
            );

        $this->get(route('it-asset-requests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('it-asset-requests/create')
                ->where('defaultEmployeeId', $employee->id)
            );

        $this->get(route('employee-requests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('employee-requests/create')
                ->where('defaultEmployeeId', $employee->id)
            );
    }

    public function test_linked_employee_without_company_profile_is_available_and_default_on_create_forms(): void
    {
        $role = Role::query()->where('slug', 'employee')->firstOrFail();
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'company_profile_id' => null,
        ]);

        $this->actingAs($user);

        $this->get(route('leave-requests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('leave-requests/create')
                ->where('defaultEmployeeId', $employee->id)
                ->where('employees.0.id', $employee->id)
                ->where('employees.0.department_id', $department->id));

        $this->get(route('employee-requests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('employee-requests/create')
                ->where('defaultEmployeeId', $employee->id)
                ->where('canChooseEmployee', false)
                ->has('employees', 1)
                ->where('employees.0.id', $employee->id)
                ->where('employees.0.department_id', $department->id)
                ->where('employees.0.job_position_id', $jobPosition->id));
    }

    public function test_administrator_can_choose_any_employee_on_create_forms(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        Employee::factory()->count(2)->create([
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
        ]);

        $this->get(route('employee-requests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('employee-requests/create')
                ->where('canChooseEmployee', true)
                ->has('employees', 2));
    }

    public function test_edit_forms_include_employee_department_id_in_options(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
        ]);

        $itRequest = ItRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-03-24',
            'status' => 'draft',
        ]);

        $itAssetRequest = ItAssetRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-03-24',
            'status' => 'draft',
        ]);

        $employeeRequest = EmployeeRequest::query()->create([
            'employee_id' => $employee->id,
            'job_position_id' => $jobPosition->id,
            'department_id' => $department->id,
            'date' => '2026-03-24',
            'date_of_joining' => '2026-03-24',
            'status' => 'draft',
        ]);

        $this->get(route('it-requests.edit', $itRequest))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('it-requests/edit')
                ->has('signaturesUrl')
                ->has('canDecide')
                ->where('employees.0.id', $employee->id)
                ->where('employees.0.department_id', $department->id)
            );

        $this->get(route('it-asset-requests.edit', $itAssetRequest))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('it-asset-requests/edit')
                ->has('canDecide')
                ->where('employees.0.id', $employee->id)
                ->where('employees.0.department_id', $department->id)
            );

        $this->get(route('employee-requests.edit', $employeeRequest))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('employee-requests/edit')
                ->has('signaturesUrl')
                ->has('canDecide')
                ->where('employees.0.id', $employee->id)
                ->where('employees.0.department_id', $department->id)
                ->where('employees.0.job_position_id', $jobPosition->id)
            );
    }
}
