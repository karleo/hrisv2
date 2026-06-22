<?php

namespace Tests\Feature;

use App\Enums\PayDeductionBehavior;
use App\Enums\PermissionModule;
use App\Models\PayAllowanceType;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Database\Seeders\PayComponentTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PayComponentTypeTest extends TestCase
{
    use RefreshDatabase;

    private function makePayrollAdmin(): User
    {
        $role = Role::factory()->create();

        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::Payroll,
            'can_access' => true,
            'can_view' => true,
            'can_create' => true,
            'can_update' => true,
            'can_delete' => true,
            'can_check_in' => false,
            'can_check_out' => false,
            'can_verify' => false,
        ]);

        return User::factory()->create(['role_id' => $role->id, 'email_verified_at' => now()]);
    }

    public function test_seeder_creates_default_allowance_and_deduction_types(): void
    {
        $this->seed(PayComponentTypeSeeder::class);

        $this->assertDatabaseHas('pay_allowance_types', ['code' => 'ALW-HOUSING', 'name' => 'Housing']);
        $this->assertDatabaseHas('pay_deduction_types', ['code' => 'DED-LOAN', 'behavior' => PayDeductionBehavior::Loan->value]);
        $this->assertDatabaseHas('pay_deduction_types', ['code' => 'DED-CASH-ADV', 'behavior' => PayDeductionBehavior::CashAdvance->value]);
    }

    public function test_payroll_user_can_manage_allowance_types(): void
    {
        $user = $this->makePayrollAdmin();

        $this->actingAs($user)
            ->get(route('payroll.allowance-types.index'))
            ->assertOk();

        $this->actingAs($user)
            ->post(route('payroll.allowance-types.store'), [
                'code' => 'ALW-CUSTOM',
                'name' => 'Custom Allowance',
                'description' => 'Test allowance',
                'is_active' => true,
                'sort_order' => 10,
            ])
            ->assertRedirect(route('payroll.allowance-types.index'));

        $type = PayAllowanceType::query()->where('code', 'ALW-CUSTOM')->firstOrFail();

        $this->actingAs($user)
            ->put(route('payroll.allowance-types.update', $type), [
                'code' => 'ALW-CUSTOM',
                'name' => 'Updated Allowance',
                'description' => 'Updated',
                'is_active' => true,
                'sort_order' => 11,
            ])
            ->assertRedirect(route('payroll.allowance-types.index'));

        $this->assertDatabaseHas('pay_allowance_types', ['id' => $type->id, 'name' => 'Updated Allowance']);

        $this->actingAs($user)
            ->delete(route('payroll.allowance-types.destroy', $type))
            ->assertRedirect(route('payroll.allowance-types.index'));

        $this->assertDatabaseMissing('pay_allowance_types', ['id' => $type->id]);
    }

    public function test_payroll_user_can_manage_deduction_types_with_behavior(): void
    {
        $user = $this->makePayrollAdmin();

        $this->actingAs($user)
            ->get(route('payroll.deduction-types.index'))
            ->assertOk();

        $this->actingAs($user)
            ->post(route('payroll.deduction-types.store'), [
                'code' => 'DED-CUSTOM',
                'name' => 'Union fee',
                'behavior' => PayDeductionBehavior::Standard->value,
                'description' => 'Monthly union fee',
                'is_active' => true,
                'sort_order' => 5,
            ])
            ->assertRedirect(route('payroll.deduction-types.index'));

        $this->assertDatabaseHas('pay_deduction_types', [
            'code' => 'DED-CUSTOM',
            'behavior' => PayDeductionBehavior::Standard->value,
        ]);
    }
}
