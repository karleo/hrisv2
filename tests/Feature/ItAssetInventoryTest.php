<?php

namespace Tests\Feature;

use App\Enums\ItAssetCategory;
use App\Enums\ItAssetStatus;
use App\Models\Accessory;
use App\Models\Hardware;
use App\Models\ItAsset;
use App\Models\Software;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ItAssetInventoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs(User::factory()->create());
    }

    public function test_index_lists_assets(): void
    {
        ItAsset::factory()->hardware()->create(['name' => 'Office Laptop']);

        $response = $this->get(route('it-assets.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('it-assets/index')
            ->has('assets.data', 1)
            ->where('assets.data.0.name', 'Office Laptop')
        );
    }

    public function test_store_creates_hardware_asset(): void
    {
        $hardware = Hardware::factory()->create();

        $response = $this->post(route('it-assets.store'), [
            'category' => ItAssetCategory::Hardware->value,
            'name' => 'Assigned Laptop',
            'hardware_id' => $hardware->id,
            'serial_number' => 'LAP-100',
            'asset_value' => '3500.00',
            'asset_currency' => 'AED',
            'purchase_date' => '2026-01-15',
        ]);

        $asset = ItAsset::query()->firstOrFail();
        $response->assertRedirect(route('it-assets.show', $asset));
        $this->assertDatabaseHas('it_assets', [
            'category' => ItAssetCategory::Hardware->value,
            'hardware_id' => $hardware->id,
            'serial_number' => 'LAP-100',
            'status' => ItAssetStatus::Available->value,
            'asset_value' => '3500.00',
            'asset_currency' => 'AED',
            'purchase_date' => '2026-01-15',
        ]);
    }

    public function test_store_creates_software_asset(): void
    {
        $software = Software::factory()->create();

        $response = $this->post(route('it-assets.store'), [
            'category' => ItAssetCategory::Software->value,
            'name' => 'Office License',
            'software_id' => $software->id,
            'license_key' => 'MS-OFFICE-001',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('it_assets', [
            'category' => ItAssetCategory::Software->value,
            'software_id' => $software->id,
            'license_key' => 'MS-OFFICE-001',
        ]);
    }

    public function test_store_creates_accessory_asset(): void
    {
        $accessory = Accessory::factory()->create();

        $response = $this->post(route('it-assets.store'), [
            'category' => ItAssetCategory::Accessory->value,
            'name' => 'Wireless Mouse',
            'accessory_id' => $accessory->id,
            'serial_number' => 'MOU-001',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('it_assets', [
            'category' => ItAssetCategory::Accessory->value,
            'accessory_id' => $accessory->id,
            'serial_number' => 'MOU-001',
        ]);
    }

    public function test_index_filters_by_category(): void
    {
        ItAsset::factory()->hardware()->create();
        ItAsset::factory()->software()->create();

        $response = $this->get(route('it-assets.index', ['category' => ItAssetCategory::Software->value]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('assets.data', 1)
            ->where('assets.data.0.category', ItAssetCategory::Software->value)
        );
    }

    public function test_index_search_filters_by_code_and_catalog_name(): void
    {
        ItAsset::factory()->hardware()->create(['name' => 'Office Laptop']);
        ItAsset::factory()->software()->create(['name' => 'Other']);

        $response = $this->get(route('it-assets.index', ['search' => 'Office']));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('assets.data', 1)
            ->where('assets.data.0.name', 'Office Laptop')
        );
    }

    public function test_print_renders_asset_label_page(): void
    {
        $asset = ItAsset::factory()->hardware()->create([
            'asset_value' => '1200.00',
            'asset_currency' => 'AED',
            'purchase_date' => '2026-01-10',
        ]);

        $response = $this->get(route('it-assets.print', $asset));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('it-assets/print')
            ->where('asset.code', $asset->code)
            ->where('asset.asset_value', '1200.00')
            ->where('asset.asset_currency', 'AED')
        );
    }

    public function test_update_assigned_asset_can_attach_assignment_documents(): void
    {
        Storage::fake('public');
        $employee = \App\Models\Employee::factory()->create();
        $asset = ItAsset::factory()->software()->assigned()->create([
            'current_employee_id' => $employee->id,
            'name' => 'Office License',
        ]);
        $assignment = \App\Models\ItAssetAssignment::factory()->create([
            'it_asset_id' => $asset->id,
            'employee_id' => $employee->id,
            'returned_at' => null,
        ]);
        $document = UploadedFile::fake()->create('handover.pdf', 100, 'application/pdf');

        $response = $this->put(route('it-assets.update', $asset), [
            'name' => 'Office License',
            'condition_notes' => 'Updated notes',
            'remarks' => 'Updated remarks',
            'documents' => [$document],
        ]);

        $response->assertRedirect(route('it-assets.show', $asset));
        $this->assertDatabaseHas('it_asset_assignment_documents', [
            'it_asset_assignment_id' => $assignment->id,
            'original_name' => 'handover.pdf',
        ]);
    }
}
