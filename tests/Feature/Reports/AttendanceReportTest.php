<?php

namespace Tests\Feature\Reports;

use App\Enums\BiometricConnectionType;
use App\Enums\BiometricPunchDirection;
use App\Enums\PermissionModule;
use App\Models\BiometricDevice;
use App\Models\BiometricPunch;
use App\Models\CompanyProfile;
use App\Models\Employee;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->withoutVite();
    }

    public function test_guest_cannot_view_attendance_report(): void
    {
        $this->get(route('attendance-management.index'))->assertRedirect();
    }

    public function test_authorized_user_can_generate_attendance_report(): void
    {
        $user = $this->userWithReportsAccess();
        $companyId = (int) $user->employee()->value('company_profile_id');
        $device = BiometricDevice::query()->create([
            'name' => 'Main gate',
            'serial_number' => 'SN-REPORT-1',
            'connection_type' => BiometricConnectionType::DeviceWebReport,
            'host' => '192.168.1.44',
            'port' => 80,
            'timezone' => 'UTC',
            'is_active' => true,
        ]);
        $employee = Employee::factory()->create([
            'company_profile_id' => $companyId,
            'biometric_user_id' => '55',
            'first_name' => 'Ellen',
            'last_name' => 'Kautzer',
        ]);

        BiometricPunch::query()->create([
            'biometric_device_id' => $device->id,
            'device_user_id' => '55',
            'employee_id' => $employee->id,
            'punched_at' => '2026-05-25 10:16:50',
            'direction' => BiometricPunchDirection::In,
            'idempotency_key' => 'report-in-1',
        ]);
        BiometricPunch::query()->create([
            'biometric_device_id' => $device->id,
            'device_user_id' => '55',
            'employee_id' => $employee->id,
            'punched_at' => '2026-05-25 18:00:00',
            'direction' => BiometricPunchDirection::Out,
            'idempotency_key' => 'report-out-1',
        ]);

        $this->actingAs($user)
            ->get(route('attendance-management.index', [
                'from' => '2026-05-25',
                'to' => '2026-05-25',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('attendance-management/index')
                ->has('rows.data', 1)
                ->where('rows.data.0.employee_name', 'Ellen Kautzer')
                ->where('rows.data.0.clock_in', '10:16:50')
                ->where('rows.data.0.clock_out', '18:00:00')
                ->where('rows.data.0.working_hours', '7h 43m')
                ->where('summary.total_punches', 2));
    }

    public function test_attendance_report_csv_export(): void
    {
        $user = $this->administratorWithReportsAccess();
        $device = BiometricDevice::query()->create([
            'name' => 'Gate',
            'serial_number' => 'SN-REPORT-2',
            'connection_type' => BiometricConnectionType::DeviceWebReport,
            'host' => '192.168.1.44',
            'port' => 80,
            'timezone' => 'UTC',
            'is_active' => true,
        ]);

        BiometricPunch::query()->create([
            'biometric_device_id' => $device->id,
            'device_user_id' => '1',
            'employee_id' => null,
            'punched_at' => '2026-05-20 08:00:00',
            'direction' => BiometricPunchDirection::In,
            'idempotency_key' => 'report-csv-1',
        ]);

        $response = $this->actingAs($user)
            ->get(route('attendance-management.index', [
                'from' => '2026-05-20',
                'to' => '2026-05-20',
                'export' => 'csv',
            ]));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Unmapped (PIN 1)', $response->streamedContent());
    }

    public function test_employee_role_user_report_is_limited_to_own_attendance(): void
    {
        $role = Role::query()->where('slug', 'employee')->firstOrFail();
        RoleModulePermission::query()->updateOrCreate(
            [
                'role_id' => $role->id,
                'module' => PermissionModule::TimeAttendance,
            ],
            [
                'can_access' => true,
                'can_view' => true,
                'can_create' => false,
                'can_update' => false,
                'can_delete' => false,
                'can_check_in' => false,
                'can_check_out' => false,
            ],
        );

        RoleModulePermission::query()->updateOrCreate(
            [
                'role_id' => $role->id,
                'module' => PermissionModule::Reports,
            ],
            [
                'can_access' => true,
                'can_view' => true,
                'can_create' => false,
                'can_update' => false,
                'can_delete' => false,
                'can_check_in' => false,
                'can_check_out' => false,
            ],
        );

        $company = CompanyProfile::factory()->create();
        $user = User::factory()->create(['role_id' => $role->id]);
        $ownEmployee = Employee::factory()->create([
            'user_id' => $user->id,
            'company_profile_id' => $company->id,
            'biometric_user_id' => '77',
            'first_name' => 'Sharon',
            'last_name' => 'Mendero',
        ]);
        $otherEmployee = Employee::factory()->create([
            'company_profile_id' => $company->id,
            'biometric_user_id' => '88',
            'first_name' => 'Other',
            'last_name' => 'Employee',
        ]);

        $device = BiometricDevice::query()->create([
            'name' => 'Main gate',
            'serial_number' => 'SN-REPORT-EMP',
            'connection_type' => BiometricConnectionType::DeviceWebReport,
            'host' => '192.168.1.44',
            'port' => 80,
            'timezone' => 'UTC',
            'is_active' => true,
        ]);

        foreach ([$ownEmployee, $otherEmployee] as $employee) {
            BiometricPunch::query()->create([
                'biometric_device_id' => $device->id,
                'device_user_id' => (string) $employee->biometric_user_id,
                'employee_id' => $employee->id,
                'punched_at' => '2026-05-25 09:00:00',
                'direction' => BiometricPunchDirection::In,
                'idempotency_key' => 'report-employee-role-'.$employee->id,
            ]);
        }

        $this->actingAs($user)
            ->get(route('attendance-management.index', [
                'from' => '2026-05-25',
                'to' => '2026-05-25',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('canChooseEmployee', false)
                ->where('filters.employee_id', (string) $ownEmployee->id)
                ->has('employees', 1)
                ->where('employees.0.name', 'Sharon Mendero')
                ->has('rows.data', 1)
                ->where('rows.data.0.employee_name', 'Sharon Mendero'));

        $this->actingAs($user)
            ->get(route('attendance-management.index', [
                'from' => '2026-05-25',
                'to' => '2026-05-25',
                'employee_id' => $otherEmployee->id,
            ]))
            ->assertForbidden();
    }

    public function test_attendance_report_pdf_export(): void
    {
        $user = $this->userWithReportsAccess();
        $companyId = (int) $user->employee()->value('company_profile_id');
        $device = BiometricDevice::query()->create([
            'name' => 'Main gate',
            'serial_number' => 'SN-REPORT-PDF',
            'connection_type' => BiometricConnectionType::DeviceWebReport,
            'host' => '192.168.1.44',
            'port' => 80,
            'timezone' => 'UTC',
            'is_active' => true,
        ]);
        $employee = Employee::factory()->create([
            'company_profile_id' => $companyId,
            'biometric_user_id' => '55',
            'first_name' => 'Ellen',
            'last_name' => 'Kautzer',
        ]);

        BiometricPunch::query()->create([
            'biometric_device_id' => $device->id,
            'device_user_id' => '55',
            'employee_id' => $employee->id,
            'punched_at' => '2026-05-25 10:16:50',
            'direction' => BiometricPunchDirection::In,
            'idempotency_key' => 'report-pdf-in',
        ]);

        $response = $this->actingAs($user)
            ->get(route('attendance-management.index', [
                'from' => '2026-05-25',
                'to' => '2026-05-25',
                'employee_id' => $employee->id,
                'export' => 'pdf',
            ]));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    private function userWithReportsAccess(): User
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::TimeAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => false,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::Reports,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => false,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $company = CompanyProfile::factory()->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        Employee::factory()->create([
            'user_id' => $user->id,
            'company_profile_id' => $company->id,
        ]);

        return $user;
    }

    private function administratorWithReportsAccess(): User
    {
        $adminRole = Role::query()->firstOrCreate(
            ['slug' => 'administrator'],
            ['name' => 'Administrator'],
        );
        RoleModulePermission::query()->firstOrCreate(
            [
                'role_id' => $adminRole->id,
                'module' => PermissionModule::Reports,
            ],
            [
                'can_access' => true,
                'can_view' => true,
                'can_create' => false,
                'can_update' => false,
                'can_delete' => false,
                'can_check_in' => false,
                'can_check_out' => false,
            ],
        );

        return User::factory()->create(['role_id' => $adminRole->id]);
    }
}
