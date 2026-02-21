<?php

namespace Database\Factories;

use App\Models\CompanyProfile;
use App\Models\Country;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CompanyProfile>
 */
class CompanyProfileFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = CompanyProfile::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_name' => fake()->company(),
            'company_address_1' => fake()->streetAddress(),
            'company_address_2' => fake()->optional(0.5)->secondaryAddress(),
            'country_id' => Country::query()->inRandomOrder()->first()?->id,
            'website' => fake()->optional(0.7)->url(),
        ];
    }
}
