<?php

namespace Database\Factories;

use App\Enums\ItAssetEventType;
use App\Models\ItAsset;
use App\Models\ItAssetEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ItAssetEvent>
 */
class ItAssetEventFactory extends Factory
{
    protected $model = ItAssetEvent::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'it_asset_id' => ItAsset::factory(),
            'event_type' => ItAssetEventType::Created,
            'actor_user_id' => User::factory(),
            'actor_name' => fake()->name(),
            'metadata' => null,
            'created_at' => now(),
        ];
    }
}
