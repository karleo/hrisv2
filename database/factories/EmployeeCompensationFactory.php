<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\EmployeeCompensation;
use App\Models\EmployeeCompensationItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmployeeCompensation>
 */
class EmployeeCompensationFactory extends Factory
{
    protected $model = EmployeeCompensation::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'basic_salary' => fake()->numberBetween(3000, 15000),
            'currency' => 'AED',
            'pay_frequency' => 'monthly',
            'housing_allowance' => 0,
            'transport_allowance' => 0,
            'food_allowance' => 0,
            'other_allowance' => 0,
            'loan_deduction' => 0,
            'other_deduction' => 0,
            'overtime_rate_multiplier' => 1.25,
            'overtime_rate_basis' => EmployeeCompensation::OVERTIME_BASIS_PER_HOUR,
            'overtime_standard_monthly_hours' => 176,
            'bank_name' => null,
            'bank_account_number' => null,
            'iban' => null,
            'effective_from' => null,
            'notes' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (EmployeeCompensation $compensation): void {
            EmployeeCompensationItem::query()->create([
                'employee_compensation_id' => $compensation->id,
                'type' => EmployeeCompensationItem::TYPE_ALLOWANCE,
                'name' => 'Housing',
                'amount' => fake()->numberBetween(500, 3000),
                'sort_order' => 0,
            ]);

            $compensation->syncLegacyAggregateColumns();
            $compensation->save();
        });
    }
}
