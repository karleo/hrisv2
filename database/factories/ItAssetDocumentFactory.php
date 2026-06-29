<?php

namespace Database\Factories;

use App\Models\ItAsset;
use App\Models\ItAssetDocument;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ItAssetDocument>
 */
class ItAssetDocumentFactory extends Factory
{
    protected $model = ItAssetDocument::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'it_asset_id' => ItAsset::factory(),
            'path' => 'it-assets/1/documents/spec-sheet.pdf',
            'original_name' => 'spec-sheet.pdf',
            'uploaded_by_user_id' => User::factory(),
        ];
    }
}
