<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\HardwareAssetValue;
use App\Models\ItAssetRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ItAssetRequestSignaturesTest extends TestCase
{
    use RefreshDatabase;

    public function test_print_renders_printable_page(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->actingAs($user);

        /** @var Department $department */
        $department = Department::factory()->create();
        /** @var Employee $employee */
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
        ]);

        $itAssetRequest = ItAssetRequest::query()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
            'date' => '2026-03-31',
            'status' => 'submitted',
        ]);
        $hardware = Hardware::factory()->create([
            'code' => 'CASE',
            'name' => 'Computer Case',
        ]);
        $assetValue = HardwareAssetValue::factory()->create([
            'hardware_id' => $hardware->id,
            'asset_model' => 'Computer Case Model X',
        ]);
        $itAssetRequest->hardwareItems()->create([
            'hardware_asset_value_id' => $assetValue->id,
            'hardware_id' => $hardware->id,
            'serial_number' => 'CASE-001',
            'hardware_code_snapshot' => 'CASE',
            'hardware_name_snapshot' => 'Computer Case',
            'asset_model_snapshot' => 'Computer Case Model X',
            'serial_number_snapshot' => 'CASE-001',
        ]);

        $response = $this->get(route('it-asset-requests.print', $itAssetRequest));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('it-asset-requests/print')
            ->has('itAssetRequest')
            ->has('companyLogoUrl')
            ->where('itAssetRequest.id', $itAssetRequest->id)
            ->where('hardwareItems.0.asset_model', 'Computer Case Model X')
            ->where('hardwareItems.0.hardware.name', 'Computer Case')
        );
    }

    public function test_user_can_update_it_asset_request_signatures(): void
    {
        Storage::fake('public');

        /** @var User $user */
        $user = User::factory()->create();
        $this->actingAs($user);

        /** @var Employee $employee */
        $employee = Employee::factory()->create();

        /** @var Department $department */
        $department = Department::factory()->create();

        /** @var ItAssetRequest $itAssetRequest */
        $itAssetRequest = ItAssetRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $department->id,
        ]);

        $employeeSignature = UploadedFile::fake()->image('employee-signature.png');
        $issuedBySignature = UploadedFile::fake()->image('issued-by-signature.png');

        /** @var Employee $issuer */
        $issuer = Employee::factory()->create();

        $response = $this->post(route('it-asset-requests.signatures.update', $itAssetRequest), [
            'employee_signature' => $employeeSignature,
            'issued_by_signature' => $issuedBySignature,
            'issued_by_employee_id' => $issuer->id,
        ]);

        $response->assertRedirect();

        $itAssetRequest->refresh();

        $this->assertNotNull($itAssetRequest->employee_signature);
        $this->assertNotNull($itAssetRequest->issued_by_signature);
        $this->assertSame($issuer->id, $itAssetRequest->issued_by_employee_id);

        Storage::disk('public')->assertExists($itAssetRequest->employee_signature);
        Storage::disk('public')->assertExists($itAssetRequest->issued_by_signature);
    }
}
