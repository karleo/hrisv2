<?php

namespace Tests\Feature\Reports;

use App\Enums\ItAssetCategory;
use App\Enums\ItAssetStatus;
use App\Enums\PermissionModule;
use App\Models\CompanyProfile;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\ItAsset;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItAssetInventoryReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->withoutVite();
    }

    public function test_guest_cannot_view_it_asset_inventory_report(): void
    {
        $this->get(route('reports.it-asset-inventory'))->assertRedirect();
    }

    public function test_authorized_user_can_generate_it_asset_inventory_report(): void
    {
        $user = $this->userWithReportsAccess();
        $hardware = Hardware::factory()->create(['name' => 'Laptop']);
        $employee = Employee::factory()->create([
            'company_profile_id' => (int) $user->employee()->value('company_profile_id'),
            'first_name' => 'Jane',
            'last_name' => 'Doe',
        ]);

        ItAsset::factory()->hardware()->create([
            'hardware_id' => $hardware->id,
            'name' => 'Jane Laptop',
            'status' => ItAssetStatus::Assigned,
            'current_employee_id' => $employee->id,
            'purchase_date' => '2026-06-15',
            'asset_value' => 1200.50,
            'asset_currency' => 'USD',
        ]);

        $this->actingAs($user)
            ->get(route('reports.it-asset-inventory', [
                'from' => '2026-06-01',
                'to' => '2026-06-30',
                'category' => ItAssetCategory::Hardware->value,
                'hardware_id' => $hardware->id,
                'employee_id' => $employee->id,
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('reports/it-asset-inventory')
                ->has('rows.data', 1)
                ->where('rows.data.0.label', 'Jane Laptop')
                ->where('rows.data.0.device_type', 'Laptop')
                ->where('rows.data.0.employee_name', 'Jane Doe')
                ->where('summary.total_assets', 1));
    }

    public function test_it_asset_inventory_report_csv_export(): void
    {
        $user = $this->administratorWithReportsAccess();
        $hardware = Hardware::factory()->create(['name' => 'Monitor']);

        ItAsset::factory()->hardware()->create([
            'hardware_id' => $hardware->id,
            'name' => 'Desk Monitor',
            'purchase_date' => '2026-06-10',
        ]);

        $response = $this->actingAs($user)
            ->get(route('reports.it-asset-inventory', [
                'from' => '2026-06-01',
                'to' => '2026-06-30',
                'export' => 'csv',
            ]));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Desk Monitor', $response->streamedContent());
        $this->assertStringContainsString('Monitor', $response->streamedContent());
    }

    public function test_it_asset_inventory_report_pdf_export(): void
    {
        $user = $this->administratorWithReportsAccess();

        ItAsset::factory()->hardware()->create([
            'name' => 'PDF Asset',
            'purchase_date' => '2026-06-12',
        ]);

        $response = $this->actingAs($user)
            ->get(route('reports.it-asset-inventory', [
                'from' => '2026-06-01',
                'to' => '2026-06-30',
                'export' => 'pdf',
            ]));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_it_asset_inventory_report_without_date_filter_includes_all_assets(): void
    {
        $user = $this->administratorWithReportsAccess();

        ItAsset::factory()->count(2)->hardware()->create();

        $this->actingAs($user)
            ->get(route('reports.it-asset-inventory'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('reports/it-asset-inventory')
                ->where('summary.total_assets', 2));
    }

    private function userWithReportsAccess(): User
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::Reports,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => false,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $company = CompanyProfile::factory()->create();
        $user = User::factory()->create(['role_id' => $role->id]);

        Employee::factory()->create([
            'user_id' => $user->id,
            'company_profile_id' => $company->id,
        ]);

        return $user;
    }

    private function administratorWithReportsAccess(): User
    {
        $adminRole = Role::query()->firstOrCreate(
            ['slug' => 'administrator'],
            ['name' => 'Administrator'],
        );
        RoleModulePermission::query()->firstOrCreate(
            [
                'role_id' => $adminRole->id,
                'module' => PermissionModule::Reports,
            ],
            [
                'can_access' => true,
                'can_view' => true,
                'can_create' => false,
                'can_update' => false,
                'can_delete' => false,
                'can_check_in' => false,
                'can_check_out' => false,
            ],
        );

        return User::factory()->create(['role_id' => $adminRole->id]);
    }
}
