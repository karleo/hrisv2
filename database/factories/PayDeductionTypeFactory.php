<?php

namespace Database\Factories;

use App\Enums\PayDeductionBehavior;
use App\Models\PayDeductionType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PayDeductionType>
 */
class PayDeductionTypeFactory extends Factory
{
    protected $model = PayDeductionType::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('DED-###')),
            'name' => fake()->words(2, true),
            'behavior' => PayDeductionBehavior::Standard,
            'description' => fake()->optional()->sentence(),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }

    public function loan(): static
    {
        return $this->state(fn () => [
            'behavior' => PayDeductionBehavior::Loan,
        ]);
    }

    public function cashAdvance(): static
    {
        return $this->state(fn () => [
            'behavior' => PayDeductionBehavior::CashAdvance,
        ]);
    }
}
