<?php

namespace Database\Factories;

use App\Models\Hardware;
use App\Models\HardwareAssetValue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HardwareAssetValue>
 */
class HardwareAssetValueFactory extends Factory
{
    protected $model = HardwareAssetValue::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'hardware_id' => Hardware::factory(),
            'asset_value' => fake()->randomFloat(2, 100, 10000),
            'asset_currency' => 'AED',
            'effective_from' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'effective_to' => null,
            'is_active' => true,
        ];
    }
}
