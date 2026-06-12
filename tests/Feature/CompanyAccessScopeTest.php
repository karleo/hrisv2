<?php

namespace Tests\Feature;

use App\Enums\BiometricConnectionType;
use App\Enums\BiometricPunchDirection;
use App\Enums\PermissionModule;
use App\Models\BiometricDevice;
use App\Models\BiometricPunch;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use App\Models\LeaveRequest;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use App\Models\WorkTimetable;
use App\Support\CompanyAccessScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class CompanyAccessScopeTest extends TestCase
{
    use RefreshDatabase;

    private CompanyAccessScope $companyScope;

    protected function setUp(): void
    {
        parent::setUp();

        $this->companyScope = app(CompanyAccessScope::class);
    }

    private function hrUserWithCompany(CompanyProfile $companyProfile): User
    {
        $role = Role::factory()->create([
            'name' => 'HR',
            'slug' => 'hr',
        ]);

        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::Employees,
            'can_access' => true,
            'can_view' => true,
            'can_create' => true,
            'can_update' => true,
            'can_delete' => false,
        ]);

        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        Employee::factory()->create([
            'user_id' => $user->id,
            'company_profile_id' => $companyProfile->id,
            'department_id' => Department::factory(),
            'job_position_id' => JobPosition::factory(),
            'work_timetable_id' => WorkTimetable::factory(),
        ]);

        return $user;
    }

    public function test_administrator_sees_all_employees(): void
    {
        $companyA = CompanyProfile::factory()->create(['company_name' => 'Company A']);
        $companyB = CompanyProfile::factory()->create(['company_name' => 'Company B']);

        Employee::factory()->create(['company_profile_id' => $companyA->id]);
        Employee::factory()->create(['company_profile_id' => $companyB->id]);

        $admin = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($admin)
            ->get(route('employees.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('employees.data', 2));
    }

    public function test_hr_user_sees_only_employees_in_same_company(): void
    {
        $companyA = CompanyProfile::factory()->create(['company_name' => 'Company A']);
        $companyB = CompanyProfile::factory()->create(['company_name' => 'Company B']);

        Employee::factory()->create([
            'company_profile_id' => $companyA->id,
            'employee_code' => 'EMP-A-001',
        ]);
        Employee::factory()->create([
            'company_profile_id' => $companyB->id,
            'employee_code' => 'EMP-B-001',
        ]);

        $hrUser = $this->hrUserWithCompany($companyA);

        $this->actingAs($hrUser)
            ->get(route('employees.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('employees.data', 2)
                ->where('employees.data', fn ($employees) => collect($employees)->pluck('employee_code')->contains('EMP-A-001')
                    && ! collect($employees)->pluck('employee_code')->contains('EMP-B-001')));
    }

    public function test_hr_user_cannot_edit_employee_from_other_company(): void
    {
        $companyA = CompanyProfile::factory()->create(['company_name' => 'Company A']);
        $companyB = CompanyProfile::factory()->create(['company_name' => 'Company B']);

        $this->hrUserWithCompany($companyA);

        $otherEmployee = Employee::factory()->create([
            'company_profile_id' => $companyB->id,
        ]);

        $hrUser = User::query()->whereHas('employee', fn ($q) => $q->where('company_profile_id', $companyA->id))->firstOrFail();

        $this->actingAs($hrUser)
            ->get(route('employees.edit', $otherEmployee))
            ->assertForbidden();
    }

    public function test_user_without_company_profile_gets_empty_employee_list(): void
    {
        $role = Role::factory()->create(['name' => 'HR', 'slug' => 'hr']);
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::Employees,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => false,
            'can_delete' => false,
        ]);

        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        Employee::factory()->count(2)->create();

        $this->actingAs($user)
            ->get(route('employees.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('employees.data', 0));
    }

    public function test_import_forces_company_for_non_admin(): void
    {
        $companyA = CompanyProfile::factory()->create(['company_name' => 'Company A']);
        $companyB = CompanyProfile::factory()->create(['company_name' => 'Company B']);

        $department = Department::factory()->create(['code' => 'ENG']);
        $jobPosition = JobPosition::factory()->create(['code' => 'DEV']);
        $timetable = WorkTimetable::factory()->create(['name' => 'General Shift']);

        $hrUser = $this->hrUserWithCompany($companyA);

        $csv = implode("\n", [
            'employee_code,first_name,last_name,email_address,contact_number,address_1,address_2,department_code,job_position_code,work_timetable_name,company_profile_name',
            'EMP-9001,Jane,Doe,jane@example.com,,,,ENG,DEV,General Shift,Company B',
        ]);

        $file = UploadedFile::fake()->createWithContent('employees.csv', $csv);

        $this->actingAs($hrUser)
            ->post(route('employees.import'), ['file' => $file])
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseMissing('employees', ['employee_code' => 'EMP-9001']);
    }

    public function test_company_access_scope_service_methods(): void
    {
        $companyA = CompanyProfile::factory()->create();
        $companyB = CompanyProfile::factory()->create();

        $employeeA = Employee::factory()->create(['company_profile_id' => $companyA->id]);
        $employeeB = Employee::factory()->create(['company_profile_id' => $companyB->id]);

        $hrUser = $this->hrUserWithCompany($companyA);
        $admin = User::factory()->create(['email_verified_at' => now()]);

        $this->assertTrue($this->companyScope->canAccessEmployee($admin, $employeeB));
        $this->assertTrue($this->companyScope->canAccessEmployee($hrUser, $employeeA));
        $this->assertFalse($this->companyScope->canAccessEmployee($hrUser, $employeeB));
        $this->assertSame($companyA->id, $this->companyScope->companyProfileIdFor($hrUser));
    }

    public function test_leave_request_list_excludes_other_company_employees(): void
    {
        $companyA = CompanyProfile::factory()->create(['company_name' => 'Company A']);
        $companyB = CompanyProfile::factory()->create(['company_name' => 'Company B']);

        $employeeA = Employee::factory()->create(['company_profile_id' => $companyA->id]);
        $employeeB = Employee::factory()->create(['company_profile_id' => $companyB->id]);

        LeaveRequest::factory()->create([
            'employee_id' => $employeeA->id,
            'department_id' => $employeeA->department_id,
            'status' => 'submitted',
        ]);
        LeaveRequest::factory()->create([
            'employee_id' => $employeeB->id,
            'department_id' => $employeeB->department_id,
            'status' => 'submitted',
        ]);

        $hrUser = $this->hrUserWithCompany($companyA);
        $this->grantModuleAccess($hrUser, PermissionModule::LeaveRequests);

        $this->actingAs($hrUser)
            ->get(route('leave-requests.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('leaveRequests.data', 1));
    }

    public function test_attendance_report_employee_dropdown_excludes_other_companies(): void
    {
        $companyA = CompanyProfile::factory()->create(['company_name' => 'Company A']);
        $companyB = CompanyProfile::factory()->create(['company_name' => 'Company B']);

        Employee::factory()->create([
            'company_profile_id' => $companyA->id,
            'first_name' => 'Alice',
            'last_name' => 'Alpha',
        ]);
        Employee::factory()->create([
            'company_profile_id' => $companyB->id,
            'first_name' => 'Bob',
            'last_name' => 'Beta',
        ]);

        $hrUser = $this->hrUserWithCompany($companyA);
        $this->grantModuleAccess($hrUser, PermissionModule::Reports);

        $this->actingAs($hrUser)
            ->get(route('reports.attendance', [
                'from' => now()->subDay()->toDateString(),
                'to' => now()->toDateString(),
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('employees', 2)
                ->where('employees', fn ($employees) => collect($employees)->pluck('name')->contains('Alice Alpha')
                    && ! collect($employees)->pluck('name')->contains('Bob Beta')));
    }

    public function test_attendance_report_rows_are_limited_to_viewer_company(): void
    {
        $companyA = CompanyProfile::factory()->create(['company_name' => 'Company A']);
        $companyB = CompanyProfile::factory()->create(['company_name' => 'Company B']);

        $device = BiometricDevice::query()->create([
            'name' => 'Gate',
            'serial_number' => 'SN-SCOPE-1',
            'connection_type' => BiometricConnectionType::DeviceWebReport,
            'host' => '192.168.1.44',
            'port' => 80,
            'timezone' => 'UTC',
            'is_active' => true,
        ]);

        $employeeA = Employee::factory()->create([
            'company_profile_id' => $companyA->id,
            'biometric_user_id' => '101',
            'first_name' => 'Alice',
            'last_name' => 'Alpha',
        ]);
        $employeeB = Employee::factory()->create([
            'company_profile_id' => $companyB->id,
            'biometric_user_id' => '102',
            'first_name' => 'Bob',
            'last_name' => 'Beta',
        ]);

        foreach ([$employeeA, $employeeB] as $employee) {
            BiometricPunch::query()->create([
                'biometric_device_id' => $device->id,
                'device_user_id' => (string) $employee->biometric_user_id,
                'employee_id' => $employee->id,
                'punched_at' => '2026-05-25 09:00:00',
                'direction' => BiometricPunchDirection::In,
                'idempotency_key' => 'scope-in-'.$employee->id,
            ]);
        }

        $hrUser = $this->hrUserWithCompany($companyA);
        $this->grantModuleAccess($hrUser, PermissionModule::Reports);

        $this->actingAs($hrUser)
            ->get(route('reports.attendance', [
                'from' => '2026-05-25',
                'to' => '2026-05-25',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('rows.data', 1)
                ->where('rows.data.0.employee_name', 'Alice Alpha'));
    }

    private function grantModuleAccess(User $user, PermissionModule $module): void
    {
        RoleModulePermission::query()->create([
            'role_id' => (int) $user->role_id,
            'module' => $module,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => false,
            'can_delete' => false,
        ]);
    }
}
