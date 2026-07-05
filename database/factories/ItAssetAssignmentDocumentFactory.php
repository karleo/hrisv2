<?php

namespace Database\Factories;

use App\Models\ItAssetAssignment;
use App\Models\ItAssetAssignmentDocument;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ItAssetAssignmentDocument>
 */
class ItAssetAssignmentDocumentFactory extends Factory
{
    protected $model = ItAssetAssignmentDocument::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'it_asset_assignment_id' => ItAssetAssignment::factory(),
            'path' => 'it-assets/1/assignments/1/sample.pdf',
            'original_name' => 'handover-form.pdf',
            'uploaded_by_user_id' => User::factory(),
        ];
    }
}
