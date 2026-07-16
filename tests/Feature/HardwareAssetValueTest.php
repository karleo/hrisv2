<?php

namespace Tests\Feature;

use App\Models\Hardware;
use App\Models\HardwareAssetValue;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HardwareAssetValueTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs(User::factory()->create());
    }

    public function test_store_normalizes_asset_currency_to_uppercase(): void
    {
        $hardware = Hardware::factory()->create();

        $response = $this->post(route('hardware-asset-values.store'), [
            'hardware_id' => $hardware->id,
            'asset_value' => '1250.50',
            'asset_currency' => 'aed',
            'effective_from' => now()->toDateString(),
            'is_active' => '1',
        ]);

        $response->assertRedirect(route('hardware-asset-values.index'));
        $this->assertDatabaseHas('hardware_asset_values', [
            'hardware_id' => $hardware->id,
            'asset_value' => '1250.50',
            'asset_currency' => 'AED',
            'is_active' => true,
        ]);
    }

    public function test_store_accepts_asset_details_without_effective_dates(): void
    {
        $hardware = Hardware::factory()->create();

        $response = $this->post(route('hardware-asset-values.store'), [
            'hardware_id' => $hardware->id,
            'asset_model' => 'Latitude 5440',
            'asset_value' => '2100.00',
            'asset_currency' => 'AED',
            'purchase_date' => now()->subDay()->toDateString(),
            'vendor' => 'Prime Vendor',
            'serial_number' => 'LAT-5440-001',
            'specs' => 'Intel i7, 16GB RAM, 512GB SSD',
            'is_active' => '1',
        ]);

        $response->assertRedirect(route('hardware-asset-values.index'));
        $this->assertDatabaseHas('hardware_asset_values', [
            'hardware_id' => $hardware->id,
            'asset_model' => 'Latitude 5440',
            'asset_value' => '2100.00',
            'asset_currency' => 'AED',
            'purchase_date' => now()->subDay()->toDateString(),
            'vendor' => 'Prime Vendor',
            'serial_number' => 'LAT-5440-001',
            'specs' => 'Intel i7, 16GB RAM, 512GB SSD',
            'effective_from' => null,
            'effective_to' => null,
        ]);
    }

    public function test_store_rejects_future_purchase_date(): void
    {
        $hardware = Hardware::factory()->create();

        $response = $this->post(route('hardware-asset-values.store'), [
            'hardware_id' => $hardware->id,
            'asset_value' => '2100.00',
            'asset_currency' => 'AED',
            'purchase_date' => now()->addDay()->toDateString(),
        ]);

        $response->assertSessionHasErrors(['purchase_date']);
    }

    public function test_index_searches_asset_model_vendor_and_serial_number(): void
    {
        $hardware = Hardware::factory()->create();
        HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_model' => 'ThinkPad T14',
            'vendor' => 'Lenovo Supplier',
            'serial_number' => 'TP-001',
        ]);
        HardwareAssetValue::factory()->create([
            'asset_model' => 'Other Model',
            'vendor' => 'Other Vendor',
            'serial_number' => 'OTHER-001',
        ]);

        $response = $this->get(route('hardware-asset-values.index', ['search' => 'TP-001']));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('hardware-asset-values/index')
            ->has('assetValues.data', 1)
            ->where('assetValues.data.0.asset_model', 'ThinkPad T14')
            ->where('assetValues.data.0.vendor', 'Lenovo Supplier')
            ->where('assetValues.data.0.serial_number', 'TP-001')
        );
    }

    public function test_it_asset_create_only_lists_active_asset_value_records(): void
    {
        $hardware = Hardware::factory()->create([
            'code' => 'LAP',
            'name' => 'Laptop',
        ]);
        $activeAsset = HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_model' => 'Latitude 5440',
            'serial_number' => 'LAT-001',
            'is_active' => true,
        ]);
        HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_model' => 'Hidden Model',
            'is_active' => false,
        ]);

        $response = $this->get(route('it-assets.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('it-assets/create')
            ->has('hardwareAssetValues', 1)
            ->where('hardwareAssetValues.0.id', $activeAsset->id)
            ->where('hardwareAssetValues.0.asset_model', 'Latitude 5440')
        );
    }
}
