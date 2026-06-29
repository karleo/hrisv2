<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\ItAsset;
use App\Models\ItAssetAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ItAssetAssignment>
 */
class ItAssetAssignmentFactory extends Factory
{
    protected $model = ItAssetAssignment::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'it_asset_id' => ItAsset::factory(),
            'employee_id' => Employee::factory(),
            'assigned_at' => now(),
            'assigned_by_user_id' => User::factory(),
        ];
    }

    public function returned(): static
    {
        return $this->state(fn (): array => [
            'returned_at' => now(),
            'returned_by_user_id' => User::factory(),
            'condition_on_return' => 'Good',
        ]);
    }
}
