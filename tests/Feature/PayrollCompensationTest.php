<?php

namespace Tests\Feature;

use App\Enums\PermissionModule;
use App\Models\Employee;
use App\Models\EmployeeCompensation;
use App\Models\EmployeeCompensationItem;
use App\Models\PayAllowanceType;
use App\Models\PayDeductionType;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Database\Seeders\PayComponentTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PayrollCompensationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PayComponentTypeSeeder::class);
    }

    private function makeAdminUser(): User
    {
        return User::factory()->create(['email_verified_at' => now()]);
    }

    private function makeUserWithPayrollCrud(): User
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
            'can_verify' => false,
        ]);

        return User::factory()->create(['role_id' => $role->id, 'email_verified_at' => now()]);
    }

    public function test_admin_can_view_compensation_page_for_employee(): void
    {
        $admin = $this->makeAdminUser();
        $employee = Employee::factory()->create();

        $this->actingAs($admin)
            ->get(route('payroll.compensation.show', $employee))
            ->assertOk();
    }

    public function test_user_without_payroll_access_cannot_view_compensation(): void
    {
        $role = Role::factory()->create();
        $user = User::factory()->create(['role_id' => $role->id, 'email_verified_at' => now()]);
        $employee = Employee::factory()->create();

        $this->actingAs($user)
            ->get(route('payroll.compensation.show', $employee))
            ->assertForbidden();
    }

    public function test_admin_can_create_compensation_for_employee(): void
    {
        $admin = $this->makeAdminUser();
        $employee = Employee::factory()->create();
        $housing = PayAllowanceType::query()->where('code', 'ALW-HOUSING')->firstOrFail();
        $transport = PayAllowanceType::query()->where('code', 'ALW-TRANSPORT')->firstOrFail();
        $loan = PayDeductionType::query()->where('code', 'DED-LOAN')->firstOrFail();

        $this->actingAs($admin)
            ->post(route('payroll.compensation.store', $employee), [
                'basic_salary' => 5000,
                'currency' => 'AED',
                'pay_frequency' => 'monthly',
                'allowances' => [
                    ['pay_allowance_type_id' => $housing->id, 'amount' => 1500],
                    ['pay_allowance_type_id' => $transport->id, 'amount' => 500],
                ],
                'deductions' => [
                    [
                        'pay_deduction_type_id' => $loan->id,
                        'amount' => 200,
                        'principal_amount' => 2000,
                        'remaining_balance' => 2000,
                    ],
                ],
                'overtime_rate_multiplier' => 1.25,
                'overtime_rate_basis' => 'per_hour',
                'overtime_standard_monthly_hours' => 176,
                'effective_from' => '2026-06-01',
            ])
            ->assertRedirect(route('payroll.compensation.show', $employee));

        $this->assertDatabaseHas('employee_compensations', [
            'employee_id' => $employee->id,
            'basic_salary' => 5000,
            'currency' => 'AED',
            'housing_allowance' => 1500,
            'loan_deduction' => 200,
        ]);

        $this->assertDatabaseHas('employee_compensation_items', [
            'name' => 'Housing',
            'amount' => 1500,
            'type' => EmployeeCompensationItem::TYPE_ALLOWANCE,
            'pay_allowance_type_id' => $housing->id,
        ]);

        $this->assertDatabaseHas('employee_compensation_items', [
            'name' => 'Loan',
            'amount' => 200,
            'principal_amount' => 2000,
            'pay_deduction_type_id' => $loan->id,
        ]);
    }

    public function test_loan_deduction_requires_principal_amount(): void
    {
        $admin = $this->makeAdminUser();
        $employee = Employee::factory()->create();
        $loan = PayDeductionType::query()->where('code', 'DED-LOAN')->firstOrFail();

        $this->actingAs($admin)
            ->post(route('payroll.compensation.store', $employee), [
                'basic_salary' => 5000,
                'currency' => 'AED',
                'pay_frequency' => 'monthly',
                'deductions' => [
                    ['pay_deduction_type_id' => $loan->id, 'amount' => 200],
                ],
            ])
            ->assertSessionHasErrors('deductions.0.principal_amount');
    }

    public function test_only_one_loan_and_one_cash_advance_allowed_per_employee(): void
    {
        $admin = $this->makeAdminUser();
        $employee = Employee::factory()->create();
        $loan = PayDeductionType::query()->where('code', 'DED-LOAN')->firstOrFail();
        $cashAdvance = PayDeductionType::query()->where('code', 'DED-CASH-ADV')->firstOrFail();

        $this->actingAs($admin)
            ->post(route('payroll.compensation.store', $employee), [
                'basic_salary' => 5000,
                'currency' => 'AED',
                'pay_frequency' => 'monthly',
                'deductions' => [
                    [
                        'pay_deduction_type_id' => $loan->id,
                        'amount' => 200,
                        'principal_amount' => 2000,
                    ],
                    [
                        'pay_deduction_type_id' => $loan->id,
                        'amount' => 100,
                        'principal_amount' => 1000,
                    ],
                ],
            ])
            ->assertSessionHasErrors('deductions');

        $this->actingAs($admin)
            ->post(route('payroll.compensation.store', $employee), [
                'basic_salary' => 5000,
                'currency' => 'AED',
                'pay_frequency' => 'monthly',
                'deductions' => [
                    [
                        'pay_deduction_type_id' => $cashAdvance->id,
                        'amount' => 150,
                        'principal_amount' => 1500,
                    ],
                    [
                        'pay_deduction_type_id' => $cashAdvance->id,
                        'amount' => 50,
                        'principal_amount' => 500,
                    ],
                ],
            ])
            ->assertSessionHasErrors('deductions');
    }

    public function test_admin_can_update_compensation(): void
    {
        $admin = $this->makeAdminUser();
        $employee = Employee::factory()->create();
        $compensation = EmployeeCompensation::factory()->create([
            'employee_id' => $employee->id,
            'basic_salary' => 5000,
        ]);
        $housing = PayAllowanceType::query()->where('code', 'ALW-HOUSING')->firstOrFail();

        $this->actingAs($admin)
            ->put(route('payroll.compensation.update', [$employee, $compensation]), [
                'basic_salary' => 5500,
                'currency' => 'AED',
                'pay_frequency' => 'monthly',
                'allowances' => [
                    ['pay_allowance_type_id' => $housing->id, 'amount' => 1500],
                ],
                'deductions' => [],
                'overtime_rate_multiplier' => 1.5,
                'overtime_rate_basis' => 'per_30_minutes',
                'overtime_standard_monthly_hours' => 180,
            ])
            ->assertRedirect(route('payroll.compensation.show', $employee));

        $this->assertDatabaseHas('employee_compensations', [
            'id' => $compensation->id,
            'basic_salary' => 5500,
            'overtime_rate_multiplier' => 1.5,
            'overtime_rate_basis' => 'per_30_minutes',
            'overtime_standard_monthly_hours' => 180,
        ]);
    }

    public function test_compensation_calculates_gross_and_net_correctly(): void
    {
        $compensation = new EmployeeCompensation([
            'basic_salary' => 5000,
            'overtime_rate_basis' => EmployeeCompensation::OVERTIME_BASIS_PER_HOUR,
            'overtime_standard_monthly_hours' => 176,
            'overtime_rate_multiplier' => 1.25,
        ]);

        $compensation->setRelation('items', collect([
            new EmployeeCompensationItem(['type' => EmployeeCompensationItem::TYPE_ALLOWANCE, 'name' => 'Housing', 'amount' => 1500]),
            new EmployeeCompensationItem(['type' => EmployeeCompensationItem::TYPE_ALLOWANCE, 'name' => 'Transport', 'amount' => 500]),
            new EmployeeCompensationItem(['type' => EmployeeCompensationItem::TYPE_ALLOWANCE, 'name' => 'Food', 'amount' => 200]),
            new EmployeeCompensationItem(['type' => EmployeeCompensationItem::TYPE_ALLOWANCE, 'name' => 'Other', 'amount' => 300]),
            new EmployeeCompensationItem(['type' => EmployeeCompensationItem::TYPE_DEDUCTION, 'name' => 'Loan', 'amount' => 250]),
            new EmployeeCompensationItem(['type' => EmployeeCompensationItem::TYPE_DEDUCTION, 'name' => 'Other', 'amount' => 100]),
        ]));

        $this->assertEquals(7500.0, $compensation->grossSalary());
        $this->assertEquals(350.0, $compensation->totalDeductions());
        $this->assertEquals(7150.0, $compensation->netSalary());
    }

    public function test_overtime_calculation_supports_per_30_minutes_basis(): void
    {
        $compensation = new EmployeeCompensation([
            'basic_salary' => 8800,
            'overtime_rate_basis' => EmployeeCompensation::OVERTIME_BASIS_PER_30_MINUTES,
            'overtime_standard_monthly_hours' => 176,
            'overtime_rate_multiplier' => 1.25,
        ]);

        $this->assertEquals(62.5, $compensation->calculateOvertimeAmount(60));
    }

    public function test_user_without_create_permission_cannot_store_compensation(): void
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
        $user = User::factory()->create(['role_id' => $role->id, 'email_verified_at' => now()]);
        $employee = Employee::factory()->create();

        $this->actingAs($user)
            ->post(route('payroll.compensation.store', $employee), [
                'basic_salary' => 5000,
                'currency' => 'AED',
                'pay_frequency' => 'monthly',
            ])
            ->assertForbidden();
    }
}
