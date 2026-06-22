<?php

namespace Tests\Feature;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\PayrollPeriodVerification;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PayrollPeriodVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdminUser(): User
    {
        return User::factory()->create(['email_verified_at' => now()]);
    }

    private function makeRoleWithPayrollVerify(): Role
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

    private function makeRoleWithPayrollViewOnly(): Role
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

    public function test_admin_can_view_period_verification_index(): void
    {
        $user = $this->makeAdminUser();

        $this->actingAs($user)
            ->get(route('payroll.period-verifications.index'))
            ->assertOk();
    }

    public function test_unauthenticated_user_cannot_access_payroll(): void
    {
        $this->get(route('payroll.period-verifications.index'))
            ->assertRedirect(route('login'));
    }

    public function test_user_without_payroll_permission_is_forbidden(): void
    {
        $role = Role::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('payroll.period-verifications.index'))
            ->assertForbidden();
    }

    public function test_admin_can_create_a_period_verification(): void
    {
        $user = $this->makeAdminUser();

        $this->actingAs($user)
            ->post(route('payroll.period-verifications.store'), [
                'period_from' => '2026-06-01',
                'period_to' => '2026-06-30',
            ])
            ->assertRedirect(route('payroll.period-verifications.index'));

        $this->assertDatabaseHas('payroll_period_verifications', [
            'period_from' => '2026-06-01',
            'period_to' => '2026-06-30',
            'status' => PayrollPeriodVerification::STATUS_PENDING_HR,
        ]);
    }

    public function test_creating_duplicate_period_uses_existing(): void
    {
        $user = $this->makeAdminUser();

        $this->actingAs($user)->post(route('payroll.period-verifications.store'), [
            'period_from' => '2026-06-01',
            'period_to' => '2026-06-30',
        ]);

        $this->actingAs($user)->post(route('payroll.period-verifications.store'), [
            'period_from' => '2026-06-01',
            'period_to' => '2026-06-30',
        ]);

        $this->assertDatabaseCount('payroll_period_verifications', 1);
    }

    public function test_hr_executive_can_verify_attendance(): void
    {
        $role = $this->makeRoleWithPayrollVerify();
        $user = User::factory()->create(['role_id' => $role->id, 'email_verified_at' => now()]);

        $period = PayrollPeriodVerification::query()->create([
            'period_from' => '2026-06-01',
            'period_to' => '2026-06-30',
            'status' => PayrollPeriodVerification::STATUS_PENDING_HR,
        ]);

        $this->actingAs($user)
            ->post(route('payroll.period-verifications.verify-attendance', $period), [
                'notes' => 'All attendance looks correct.',
            ])
            ->assertRedirect(route('payroll.period-verifications.show', $period));

        $period->refresh();

        $this->assertSame(PayrollPeriodVerification::STATUS_PENDING_FINANCE, $period->status);
        $this->assertSame($user->id, $period->hr_verified_by);
        $this->assertSame('All attendance looks correct.', $period->hr_notes);
        $this->assertNotNull($period->hr_verified_at);
    }

    public function test_finance_executive_can_verify_overtime_after_hr(): void
    {
        $role = $this->makeRoleWithPayrollVerify();
        $hrUser = User::factory()->create(['role_id' => $role->id, 'email_verified_at' => now()]);
        $financeUser = User::factory()->create(['role_id' => $role->id, 'email_verified_at' => now()]);

        $period = PayrollPeriodVerification::query()->create([
            'period_from' => '2026-06-01',
            'period_to' => '2026-06-30',
            'status' => PayrollPeriodVerification::STATUS_PENDING_FINANCE,
            'hr_verified_by' => $hrUser->id,
            'hr_verified_at' => now(),
        ]);

        $this->actingAs($financeUser)
            ->post(route('payroll.period-verifications.verify-overtime', $period), [
                'notes' => 'Overtime hours verified.',
            ])
            ->assertRedirect(route('payroll.period-verifications.show', $period));

        $period->refresh();

        $this->assertSame(PayrollPeriodVerification::STATUS_VERIFIED, $period->status);
        $this->assertSame($financeUser->id, $period->finance_verified_by);
        $this->assertSame('Overtime hours verified.', $period->finance_notes);
        $this->assertNotNull($period->finance_verified_at);
    }

    public function test_cannot_verify_overtime_before_hr_has_verified(): void
    {
        $role = $this->makeRoleWithPayrollVerify();
        $user = User::factory()->create(['role_id' => $role->id, 'email_verified_at' => now()]);

        $period = PayrollPeriodVerification::query()->create([
            'period_from' => '2026-06-01',
            'period_to' => '2026-06-30',
            'status' => PayrollPeriodVerification::STATUS_PENDING_HR,
        ]);

        $this->actingAs($user)
            ->post(route('payroll.period-verifications.verify-overtime', $period))
            ->assertRedirect();

        $period->refresh();
        $this->assertSame(PayrollPeriodVerification::STATUS_PENDING_HR, $period->status);
    }

    public function test_cannot_verify_attendance_after_already_verified(): void
    {
        $role = $this->makeRoleWithPayrollVerify();
        $user = User::factory()->create(['role_id' => $role->id, 'email_verified_at' => now()]);

        $period = PayrollPeriodVerification::query()->create([
            'period_from' => '2026-06-01',
            'period_to' => '2026-06-30',
            'status' => PayrollPeriodVerification::STATUS_PENDING_FINANCE,
        ]);

        $this->actingAs($user)
            ->post(route('payroll.period-verifications.verify-attendance', $period))
            ->assertRedirect();

        $period->refresh();
        $this->assertSame(PayrollPeriodVerification::STATUS_PENDING_FINANCE, $period->status);
    }

    public function test_user_without_verify_permission_cannot_verify_attendance(): void
    {
        $role = $this->makeRoleWithPayrollViewOnly();
        $user = User::factory()->create(['role_id' => $role->id, 'email_verified_at' => now()]);

        $period = PayrollPeriodVerification::query()->create([
            'period_from' => '2026-06-01',
            'period_to' => '2026-06-30',
            'status' => PayrollPeriodVerification::STATUS_PENDING_HR,
        ]);

        $this->actingAs($user)
            ->post(route('payroll.period-verifications.verify-attendance', $period))
            ->assertForbidden();
    }

    public function test_admin_can_reopen_a_verified_period(): void
    {
        $admin = $this->makeAdminUser();

        $period = PayrollPeriodVerification::query()->create([
            'period_from' => '2026-06-01',
            'period_to' => '2026-06-30',
            'status' => PayrollPeriodVerification::STATUS_VERIFIED,
            'hr_verified_by' => $admin->id,
            'hr_verified_at' => now(),
            'finance_verified_by' => $admin->id,
            'finance_verified_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('payroll.period-verifications.reopen', $period))
            ->assertRedirect(route('payroll.period-verifications.show', $period));

        $period->refresh();

        $this->assertSame(PayrollPeriodVerification::STATUS_REOPENED, $period->status);
        $this->assertNull($period->hr_verified_by);
        $this->assertNull($period->finance_verified_by);
    }

    public function test_verify_ability_is_granted_for_payroll_module(): void
    {
        $role = $this->makeRoleWithPayrollVerify();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($user->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::Verify));
        $this->assertFalse($user->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::Delete));
    }
}
