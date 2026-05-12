<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\HardwareAssetValue;
use App\Models\ItAssetRequest;
use App\Models\User;
use App\Support\ItAssetValuation;
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

    public function test_it_asset_request_create_only_lists_active_asset_value_records(): void
    {
        $hardware = Hardware::factory()->create([
            'code' => 'LAP',
            'name' => 'Laptop',
        ]);
        $activeAsset = HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_model' => 'Latitude 5440',
            'serial_number' => 'LAT-001',
            'vendor' => 'Dell Vendor',
            'specs' => 'Intel i7, 16GB RAM',
            'asset_value' => '2500.00',
            'asset_currency' => 'AED',
            'is_active' => true,
        ]);
        HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_model' => 'Hidden Model',
            'is_active' => false,
        ]);

        $response = $this->get(route('it-asset-requests.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('it-asset-requests/create')
            ->has('hardware', 1)
            ->where('hardware.0.id', $activeAsset->id)
            ->where('hardware.0.hardware_id', $hardware->id)
            ->where('hardware.0.code', 'LAP')
            ->where('hardware.0.name', 'Laptop')
            ->where('hardware.0.asset_model', 'Latitude 5440')
            ->where('hardware.0.serial_number', 'LAT-001')
            ->where('hardware.0.vendor', 'Dell Vendor')
            ->where('hardware.0.specs', 'Intel i7, 16GB RAM')
            ->where('hardware.0.asset_value', '2500.00')
            ->where('hardware.0.asset_currency', 'AED')
        );
    }

    public function test_it_asset_request_can_store_multiple_asset_models_for_same_hardware(): void
    {
        $employee = Employee::factory()->create();
        $department = Department::factory()->create();
        $hardware = Hardware::factory()->create();
        $firstAsset = HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_model' => 'Latitude 5440',
            'serial_number' => 'LAT-001',
            'is_active' => true,
        ]);
        $secondAsset = HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_model' => 'ThinkPad T14',
            'serial_number' => 'TP-001',
            'is_active' => true,
        ]);

        $response = $this->post(route('it-asset-requests.store'), [
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => now()->toDateString(),
            'hardware_items' => [
                [
                    'hardware_asset_value_id' => $firstAsset->id,
                    'hardware_id' => $hardware->id,
                    'serial_number' => 'LAT-001',
                ],
                [
                    'hardware_asset_value_id' => $secondAsset->id,
                    'hardware_id' => $hardware->id,
                    'serial_number' => 'TP-001',
                ],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('it_asset_request_hardware_items', [
            'hardware_asset_value_id' => $firstAsset->id,
            'hardware_id' => $hardware->id,
            'serial_number' => 'LAT-001',
        ]);
        $this->assertDatabaseHas('it_asset_request_hardware_items', [
            'hardware_asset_value_id' => $secondAsset->id,
            'hardware_id' => $hardware->id,
            'serial_number' => 'TP-001',
        ]);
    }

    public function test_it_asset_request_snapshots_selected_asset_value_record(): void
    {
        $employee = Employee::factory()->create();
        $department = Department::factory()->create();
        $hardware = Hardware::factory()->create([
            'code' => 'LAP',
            'name' => 'Laptop',
        ]);
        $selectedAsset = HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_model' => 'Selected Model',
            'asset_value' => '900.00',
            'asset_currency' => 'AED',
            'serial_number' => 'SEL-001',
            'effective_from' => now()->subMonth()->toDateString(),
            'is_active' => true,
        ]);
        HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_model' => 'Newer Model',
            'asset_value' => '1200.00',
            'asset_currency' => 'USD',
            'serial_number' => 'NEW-001',
            'effective_from' => now()->subDay()->toDateString(),
            'is_active' => true,
        ]);

        $response = $this->post(route('it-asset-requests.store'), [
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => now()->toDateString(),
            'hardware_items' => [
                [
                    'hardware_asset_value_id' => $selectedAsset->id,
                    'hardware_id' => $hardware->id,
                    'serial_number' => '',
                ],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('it_asset_request_hardware_items', [
            'hardware_asset_value_id' => $selectedAsset->id,
            'hardware_id' => $hardware->id,
            'serial_number' => 'SEL-001',
            'hardware_code_snapshot' => 'LAP',
            'hardware_name_snapshot' => 'Laptop',
            'asset_model_snapshot' => 'Selected Model',
            'serial_number_snapshot' => 'SEL-001',
            'asset_value_snapshot' => '900.00',
            'asset_currency_snapshot' => 'AED',
        ]);
    }

    public function test_it_asset_request_rejects_inactive_selected_asset_value(): void
    {
        $employee = Employee::factory()->create();
        $department = Department::factory()->create();
        $hardware = Hardware::factory()->create();
        $inactiveAsset = HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'is_active' => false,
        ]);

        $response = $this->post(route('it-asset-requests.store'), [
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => now()->toDateString(),
            'hardware_items' => [
                [
                    'hardware_asset_value_id' => $inactiveAsset->id,
                    'hardware_id' => $hardware->id,
                    'serial_number' => 'INACTIVE-001',
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['hardware_items.0.hardware_asset_value_id']);
    }

    public function test_it_asset_request_snapshots_latest_active_asset_value(): void
    {
        $employee = Employee::factory()->create();
        $department = Department::factory()->create();
        $hardware = Hardware::factory()->create();

        HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_value' => '900.00',
            'asset_currency' => 'AED',
            'effective_from' => now()->subMonth()->toDateString(),
            'is_active' => true,
        ]);
        HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_value' => '1200.00',
            'asset_currency' => 'usd',
            'effective_from' => now()->subDay()->toDateString(),
            'is_active' => true,
        ]);

        $response = $this->post(route('it-asset-requests.store'), [
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => now()->toDateString(),
            'hardware_items' => [
                [
                    'hardware_id' => $hardware->id,
                    'serial_number' => 'SN-001',
                ],
            ],
            'remarks' => 'New laptop',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('it_asset_request_hardware_items', [
            'hardware_id' => $hardware->id,
            'serial_number' => 'SN-001',
            'asset_value_snapshot' => '1200.00',
            'asset_currency_snapshot' => 'USD',
        ]);
    }

    public function test_it_asset_request_snapshots_active_asset_value_without_effective_dates(): void
    {
        $employee = Employee::factory()->create();
        $department = Department::factory()->create();
        $hardware = Hardware::factory()->create();

        HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_value' => '1800.00',
            'asset_currency' => 'SAR',
            'effective_from' => null,
            'effective_to' => null,
            'is_active' => true,
        ]);

        $response = $this->post(route('it-asset-requests.store'), [
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => now()->toDateString(),
            'hardware_items' => [
                [
                    'hardware_id' => $hardware->id,
                    'serial_number' => 'NO-DATE-001',
                ],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('it_asset_request_hardware_items', [
            'hardware_id' => $hardware->id,
            'serial_number' => 'NO-DATE-001',
            'asset_value_snapshot' => '1800.00',
            'asset_currency_snapshot' => 'SAR',
        ]);
    }

    public function test_approved_asset_history_preserves_snapshot_when_master_value_changes(): void
    {
        $employee = Employee::factory()->create();
        $hardware = Hardware::factory()->create([
            'code' => 'LAP',
            'name' => 'Laptop',
        ]);
        HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_value' => '1500.00',
            'asset_currency' => 'AED',
            'effective_from' => now()->subDay()->toDateString(),
        ]);

        $assetRequest = ItAssetRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $employee->department_id,
            'date' => now()->toDateString(),
            'status' => 'approved',
            'decided_at' => now(),
        ]);
        $assetRequest->hardwareItems()->createMany(app(ItAssetValuation::class)->withSnapshots([
            [
                'hardware_id' => $hardware->id,
                'serial_number' => 'LAP-001',
            ],
        ]));

        HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_value' => '2000.00',
            'asset_currency' => 'AED',
            'effective_from' => now()->addDay()->toDateString(),
        ]);

        $response = $this->get(route('employees.edit', $employee).'?tab=asset');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/edit')
            ->where('asset.0.hardware_items.0.asset_value', '1500.00')
            ->where('asset.0.hardware_items.0.asset_currency', 'AED')
            ->where('asset.0.asset_totals.0.total', '1500.00')
            ->where('asset.0.asset_totals.0.currency', 'AED')
        );
    }

    public function test_asset_totals_ignore_missing_values_and_group_by_currency(): void
    {
        $totals = app(ItAssetValuation::class)->totalsForHardwareItems([
            ['asset_value' => '100.00', 'asset_currency' => 'AED'],
            ['asset_value' => null, 'asset_currency' => 'AED'],
            ['asset_value' => '50.25', 'asset_currency' => 'USD'],
            ['asset_value' => '25.25', 'asset_currency' => 'USD'],
            ['asset_value' => '999.00', 'asset_currency' => null],
        ]);

        $this->assertSame([
            ['currency' => 'AED', 'total' => '100.00', 'count' => 1],
            ['currency' => 'USD', 'total' => '75.50', 'count' => 2],
        ], $totals);
    }
}
