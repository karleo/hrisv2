<?php

namespace Database\Factories;

use App\Models\DocumentType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentType>
 */
class DocumentTypeFactory extends Factory
{
    protected $model = DocumentType::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $code = strtoupper(fake()->unique()->bothify('??##'));

        return [
            'code' => $code,
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'requires_expiry_date' => false,
            'is_active' => true,
        ];
    }
}
