<?php

namespace Database\Factories;

use App\Models\PayAllowanceType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PayAllowanceType>
 */
class PayAllowanceTypeFactory extends Factory
{
    protected $model = PayAllowanceType::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('ALW-###')),
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }
}
