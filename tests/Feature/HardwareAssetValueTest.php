<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\HardwareAssetValue;
use App\Models\ItAssetRequest;
use App\Models\User;
use App\Support\ItAssetValuation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HardwareAssetValueTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

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
