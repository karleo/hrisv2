<?php

namespace Database\Seeders;

use App\Enums\PayDeductionBehavior;
use App\Models\PayAllowanceType;
use App\Models\PayDeductionType;
use Illuminate\Database\Seeder;

class PayComponentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $allowances = [
            ['code' => 'ALW-HOUSING', 'name' => 'Housing', 'description' => 'Monthly housing allowance', 'sort_order' => 1],
            ['code' => 'ALW-TRANSPORT', 'name' => 'Transport', 'description' => 'Monthly transport allowance', 'sort_order' => 2],
            ['code' => 'ALW-FOOD', 'name' => 'Food', 'description' => 'Monthly food allowance', 'sort_order' => 3],
            ['code' => 'ALW-OTHER', 'name' => 'Other allowance', 'description' => 'Miscellaneous allowance', 'sort_order' => 99],
        ];

        foreach ($allowances as $allowance) {
            PayAllowanceType::query()->updateOrCreate(
                ['code' => $allowance['code']],
                [
                    'name' => $allowance['name'],
                    'description' => $allowance['description'],
                    'is_active' => true,
                    'sort_order' => $allowance['sort_order'],
                ],
            );
        }

        $deductions = [
            [
                'code' => 'DED-LOAN',
                'name' => 'Loan',
                'behavior' => PayDeductionBehavior::Loan,
                'description' => 'Employee loan with principal and monthly installment',
                'sort_order' => 1,
            ],
            [
                'code' => 'DED-CASH-ADV',
                'name' => 'Cash advance',
                'behavior' => PayDeductionBehavior::CashAdvance,
                'description' => 'Salary cash advance recovered over multiple pay periods',
                'sort_order' => 2,
            ],
            [
                'code' => 'DED-OTHER',
                'name' => 'Other deduction',
                'behavior' => PayDeductionBehavior::Standard,
                'description' => 'Miscellaneous recurring deduction',
                'sort_order' => 99,
            ],
        ];

        foreach ($deductions as $deduction) {
            PayDeductionType::query()->updateOrCreate(
                ['code' => $deduction['code']],
                [
                    'name' => $deduction['name'],
                    'behavior' => $deduction['behavior'],
                    'description' => $deduction['description'],
                    'is_active' => true,
                    'sort_order' => $deduction['sort_order'],
                ],
            );
        }
    }
}
