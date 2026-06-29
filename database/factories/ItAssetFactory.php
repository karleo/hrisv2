<?php

namespace Database\Factories;

use App\Enums\ItAssetCategory;
use App\Enums\ItAssetStatus;
use App\Models\Accessory;
use App\Models\Hardware;
use App\Models\ItAsset;
use App\Models\Software;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ItAsset>
 */
class ItAssetFactory extends Factory
{
    protected $model = ItAsset::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category' => ItAssetCategory::Hardware,
            'name' => fake()->words(3, true),
            'status' => ItAssetStatus::Available,
            'hardware_id' => Hardware::factory(),
            'serial_number' => strtoupper(fake()->bothify('SN-########')),
            'condition_notes' => fake()->optional()->sentence(),
            'remarks' => fake()->optional()->sentence(),
        ];
    }

    public function hardware(): static
    {
        return $this->state(fn (): array => [
            'category' => ItAssetCategory::Hardware,
            'hardware_id' => Hardware::factory(),
            'software_id' => null,
            'accessory_id' => null,
        ]);
    }

    public function software(): static
    {
        return $this->state(fn (): array => [
            'category' => ItAssetCategory::Software,
            'software_id' => Software::factory(),
            'hardware_id' => null,
            'accessory_id' => null,
            'license_key' => strtoupper(fake()->bothify('LIC-########')),
        ]);
    }

    public function accessory(): static
    {
        return $this->state(fn (): array => [
            'category' => ItAssetCategory::Accessory,
            'accessory_id' => Accessory::factory(),
            'hardware_id' => null,
            'software_id' => null,
        ]);
    }

    public function assigned(): static
    {
        return $this->state(fn (): array => [
            'status' => ItAssetStatus::Assigned,
        ]);
    }
}
