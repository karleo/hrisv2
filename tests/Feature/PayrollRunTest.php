<?php

namespace Tests\Feature;

use App\Enums\PermissionModule;
use App\Models\Employee;
use App\Models\EmployeeCompensation;
use App\Models\PayrollPeriodVerification;
use App\Models\PayrollRun;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PayrollRunTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdminUser(): User
    {
        return User::factory()->create(['email_verified_at' => now()]);
    }

    private function makeRoleWithPayrollCreate(): Role
    {
        $role = Role::factory()->create();

        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::Payroll,
            'can_access' => true,
            'can_view' => true,
            'can_create' => true,
            'can_update' => true,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
            'can_verify' => true,
        ]);

        return $role;
    }

    private function makeRoleWithViewOnly(): Role
    {
        $role = Role::factory()->create();

        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::Payroll,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => false,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
            'can_verify' => false,
        ]);

        return $role;
    }

    private function makeVerifiedPeriod(): PayrollPeriodVerification
    {
        return PayrollPeriodVerification::query()->create([
            'company_profile_id' => null,
            'period_from' => '2026-06-01',
            'period_to' => '2026-06-30',
            'status' => PayrollPeriodVerification::STATUS_VERIFIED,
            'hr_verified_by' => null,
            'hr_verified_at' => now(),
            'finance_verified_by' => null,
            'finance_verified_at' => now(),
        ]);
    }

    private function makePendingPeriod(): PayrollPeriodVerification
    {
        return PayrollPeriodVerification::query()->create([
            'company_profile_id' => null,
            'period_from' => '2026-06-01',
            'period_to' => '2026-06-30',
            'status' => PayrollPeriodVerification::STATUS_PENDING_HR,
        ]);
    }

    public function test_admin_can_list_runs(): void
    {
        $admin = $this->makeAdminUser();
        $period = $this->makeVerifiedPeriod();
        PayrollRun::query()->create([
            'payroll_period_verification_id' => $period->id,
            'status' => PayrollRun::STATUS_DRAFT,
            'currency' => 'AED',
            'total_gross' => 5000,
            'total_deductions' => 0,
            'total_net' => 5000,
        ]);

        $this->actingAs($admin)
            ->get('/payroll/runs')
            ->assertOk();
    }

    public function test_unauthenticated_user_cannot_access_runs(): void
    {
        $this->get('/payroll/runs')->assertRedirect('/login');
    }

    public function test_user_without_payroll_permission_is_forbidden(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $role = Role::factory()->create();
        $user->update(['role_id' => $role->id]);

        $this->actingAs($user)
            ->get('/payroll/runs')
            ->assertForbidden();
    }

    public function test_admin_can_create_run_from_verified_period(): void
    {
        $admin = $this->makeAdminUser();
        $period = $this->makeVerifiedPeriod();

        $response = $this->actingAs($admin)
            ->post('/payroll/runs', [
                'payroll_period_verification_id' => $period->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payroll_runs', [
            'payroll_period_verification_id' => $period->id,
            'status' => PayrollRun::STATUS_DRAFT,
        ]);
    }

    public function test_admin_cannot_create_run_from_unverified_period(): void
    {
        $admin = $this->makeAdminUser();
        $period = $this->makePendingPeriod();

        $this->actingAs($admin)
            ->post('/payroll/runs', [
                'payroll_period_verification_id' => $period->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseMissing('payroll_runs', [
            'payroll_period_verification_id' => $period->id,
        ]);
    }

    public function test_user_without_create_permission_cannot_create_run(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $role = $this->makeRoleWithViewOnly();
        $user->update(['role_id' => $role->id]);
        $period = $this->makeVerifiedPeriod();

        $this->actingAs($user)
            ->post('/payroll/runs', [
                'payroll_period_verification_id' => $period->id,
            ])
            ->assertForbidden();
    }

    public function test_admin_can_view_run_show(): void
    {
        $admin = $this->makeAdminUser();
        $period = $this->makeVerifiedPeriod();
        $run = PayrollRun::query()->create([
            'payroll_period_verification_id' => $period->id,
            'status' => PayrollRun::STATUS_DRAFT,
            'currency' => 'AED',
            'total_gross' => 0,
            'total_deductions' => 0,
            'total_net' => 0,
        ]);

        $this->actingAs($admin)
            ->get("/payroll/runs/{$run->id}")
            ->assertOk();
    }

    public function test_admin_can_approve_draft_run(): void
    {
        $admin = $this->makeAdminUser();
        $period = $this->makeVerifiedPeriod();
        $run = PayrollRun::query()->create([
            'payroll_period_verification_id' => $period->id,
            'status' => PayrollRun::STATUS_DRAFT,
            'currency' => 'AED',
            'total_gross' => 0,
            'total_deductions' => 0,
            'total_net' => 0,
        ]);

        $this->actingAs($admin)
            ->post("/payroll/runs/{$run->id}/approve")
            ->assertRedirect("/payroll/runs/{$run->id}");

        $this->assertDatabaseHas('payroll_runs', [
            'id' => $run->id,
            'status' => PayrollRun::STATUS_APPROVED,
            'approved_by' => $admin->id,
        ]);
    }

    public function test_cannot_approve_already_paid_run(): void
    {
        $admin = $this->makeAdminUser();
        $period = $this->makeVerifiedPeriod();
        $run = PayrollRun::query()->create([
            'payroll_period_verification_id' => $period->id,
            'status' => PayrollRun::STATUS_PAID,
            'currency' => 'AED',
            'total_gross' => 0,
            'total_deductions' => 0,
            'total_net' => 0,
        ]);

        $this->actingAs($admin)
            ->post("/payroll/runs/{$run->id}/approve")
            ->assertRedirect();

        $this->assertDatabaseHas('payroll_runs', [
            'id' => $run->id,
            'status' => PayrollRun::STATUS_PAID,
        ]);
    }

    public function test_admin_can_mark_approved_run_as_paid(): void
    {
        $admin = $this->makeAdminUser();
        $period = $this->makeVerifiedPeriod();
        $run = PayrollRun::query()->create([
            'payroll_period_verification_id' => $period->id,
            'status' => PayrollRun::STATUS_APPROVED,
            'currency' => 'AED',
            'total_gross' => 0,
            'total_deductions' => 0,
            'total_net' => 0,
        ]);

        $this->actingAs($admin)
            ->post("/payroll/runs/{$run->id}/mark-paid")
            ->assertRedirect("/payroll/runs/{$run->id}");

        $this->assertDatabaseHas('payroll_runs', [
            'id' => $run->id,
            'status' => PayrollRun::STATUS_PAID,
        ]);
    }

    public function test_run_calculates_employee_compensation_on_create(): void
    {
        $admin = $this->makeAdminUser();
        $period = $this->makeVerifiedPeriod();

        $employee = Employee::factory()->create(['company_profile_id' => null]);
        $compensation = EmployeeCompensation::factory()->create([
            'employee_id' => $employee->id,
            'basic_salary' => 10000,
            'overtime_rate_multiplier' => 1.25,
        ]);

        \App\Models\EmployeeCompensationItem::query()->where('employee_compensation_id', $compensation->id)->delete();

        \App\Models\EmployeeCompensationItem::query()->insert([
            ['employee_compensation_id' => $compensation->id, 'type' => 'allowance', 'name' => 'Housing', 'amount' => 2000, 'sort_order' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['employee_compensation_id' => $compensation->id, 'type' => 'allowance', 'name' => 'Transport', 'amount' => 500, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['employee_compensation_id' => $compensation->id, 'type' => 'allowance', 'name' => 'Food', 'amount' => 300, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['employee_compensation_id' => $compensation->id, 'type' => 'allowance', 'name' => 'Other', 'amount' => 200, 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['employee_compensation_id' => $compensation->id, 'type' => 'deduction', 'name' => 'Loan', 'amount' => 1000, 'sort_order' => 0, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $compensation->syncLegacyAggregateColumns();
        $compensation->save();

        $this->actingAs($admin)
            ->post('/payroll/runs', [
                'payroll_period_verification_id' => $period->id,
            ]);

        $run = PayrollRun::query()->latest()->first();
        $this->assertNotNull($run);

        $runEmployee = $run->employees()->where('employee_id', $employee->id)->first();
        $this->assertNotNull($runEmployee);
        $this->assertEquals(10000, $runEmployee->basic_salary);
        $this->assertEquals(1000, $runEmployee->loan_deduction);

        $expectedGross = 10000 + 2000 + 500 + 300 + 200; // 13000
        $this->assertEquals($expectedGross, $runEmployee->gross_salary);
    }
}
