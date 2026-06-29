<?php

namespace Tests\Feature;

use App\Enums\ItAssetEventType;
use App\Enums\ItAssetStatus;
use App\Models\Employee;
use App\Models\ItAsset;
use App\Models\ItAssetAssignment;
use App\Models\ItAssetAssignmentDocument;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ItAssetAssignReturnTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs(User::factory()->create());
        Storage::fake('public');
    }

    public function test_assign_marks_asset_as_assigned_and_stores_documents(): void
    {
        $asset = ItAsset::factory()->hardware()->create();
        $employee = Employee::factory()->create();
        $document = UploadedFile::fake()->create('handover-form.pdf', 100, 'application/pdf');

        $response = $this->post(route('it-assets.assign', $asset), [
            'employee_id' => $employee->id,
            'assignment_notes' => 'Onboarding kit',
            'documents' => [$document],
        ]);

        $response->assertRedirect(route('it-assets.show', $asset));
        $asset->refresh();
        $this->assertSame(ItAssetStatus::Assigned, $asset->status);
        $this->assertSame($employee->id, $asset->current_employee_id);
        $this->assertDatabaseHas('it_asset_assignments', [
            'it_asset_id' => $asset->id,
            'employee_id' => $employee->id,
            'returned_at' => null,
        ]);
        $this->assertDatabaseHas('it_asset_events', [
            'it_asset_id' => $asset->id,
            'event_type' => ItAssetEventType::Assigned->value,
        ]);

        $assignment = ItAssetAssignment::query()->where('it_asset_id', $asset->id)->firstOrFail();
        $this->assertDatabaseHas('it_asset_assignment_documents', [
            'it_asset_assignment_id' => $assignment->id,
            'original_name' => 'handover-form.pdf',
        ]);
        Storage::disk('public')->assertExists(
            ItAssetAssignmentDocument::query()->firstOrFail()->path
        );
    }

    public function test_assign_requires_at_least_one_document(): void
    {
        $asset = ItAsset::factory()->hardware()->create();
        $employee = Employee::factory()->create();

        $response = $this->post(route('it-assets.assign', $asset), [
            'employee_id' => $employee->id,
            'assignment_notes' => 'Missing documents',
        ]);

        $response->assertSessionHasErrors('documents');
        $this->assertSame(ItAssetStatus::Available, $asset->fresh()->status);
    }

    public function test_assignment_document_can_be_viewed(): void
    {
        $assignment = ItAssetAssignment::factory()->create();
        $path = "it-assets/{$assignment->it_asset_id}/assignments/{$assignment->id}/handover.pdf";
        Storage::disk('public')->put($path, 'pdf-content');

        $document = ItAssetAssignmentDocument::factory()->create([
            'it_asset_assignment_id' => $assignment->id,
            'path' => $path,
            'original_name' => 'handover.pdf',
        ]);

        $response = $this->get(route('it-assets.assignment-documents.show', $document));

        $response->assertOk();
    }

    public function test_return_restores_available_status(): void
    {
        $asset = ItAsset::factory()->hardware()->assigned()->create();
        $employee = Employee::factory()->create();
        ItAssetAssignment::factory()->create([
            'it_asset_id' => $asset->id,
            'employee_id' => $employee->id,
            'assigned_at' => now()->subDay(),
            'returned_at' => null,
        ]);
        $asset->update(['current_employee_id' => $employee->id]);

        $response = $this->post(route('it-assets.return', $asset), [
            'condition_on_return' => 'Good',
            'return_notes' => 'Returned at offboarding',
        ]);

        $response->assertRedirect(route('it-assets.show', $asset));
        $asset->refresh();
        $this->assertSame(ItAssetStatus::Available, $asset->status);
        $this->assertNull($asset->current_employee_id);
        $this->assertDatabaseHas('it_asset_events', [
            'it_asset_id' => $asset->id,
            'event_type' => ItAssetEventType::Returned->value,
        ]);
    }

    public function test_returns_page_lists_completed_assignments(): void
    {
        $assignment = ItAssetAssignment::factory()->returned()->create();

        $response = $this->get(route('it-assets.returns'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('it-assets/returns')
            ->has('assignments.data', 1)
            ->where('assignments.data.0.id', $assignment->id)
        );
    }
}
