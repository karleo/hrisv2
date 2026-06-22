<?php

namespace Database\Factories;

use App\Models\CompanyProfile;
use App\Models\CompanyProfileDocument;
use App\Models\DocumentType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompanyProfileDocument>
 */
class CompanyProfileDocumentFactory extends Factory
{
    protected $model = CompanyProfileDocument::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $originalName = fake()->word().'.pdf';

        return [
            'company_profile_id' => CompanyProfile::factory(),
            'document_type_id' => DocumentType::factory(),
            'name' => fake()->words(2, true),
            'path' => 'company-profiles/1/documents/'.$originalName,
            'original_name' => $originalName,
            'expiry_date' => fake()->optional()->date(),
            'status' => CompanyProfileDocument::STATUS_ACTIVE,
            'version_number' => 1,
            'archived_at' => null,
            'replaces_document_id' => null,
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (): array => [
            'status' => CompanyProfileDocument::STATUS_EXPIRED,
            'expiry_date' => now()->subDay()->toDateString(),
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn (): array => [
            'status' => CompanyProfileDocument::STATUS_ARCHIVED,
            'archived_at' => now(),
        ]);
    }
}
