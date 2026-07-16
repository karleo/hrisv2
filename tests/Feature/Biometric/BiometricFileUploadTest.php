<?php

namespace Tests\Feature\Biometric;

use App\Enums\BiometricConnectionType;
use App\Enums\BiometricSyncStatus;
use App\Enums\BiometricSyncType;
use App\Enums\PermissionModule;
use App\Models\BiometricDevice;
use App\Models\Employee;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class BiometricFileUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_upload_page_is_accessible_with_view_permission(): void
    {
        $user = $this->userWithPermissions(canUpdate: false);

        $this->actingAs($user)
            ->get(route('biometric-attendance.upload'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('biometric-attendance/upload')
                ->has('supportedFormats')
                ->has('devices'));
    }

    public function test_user_without_update_permission_cannot_upload_file(): void
    {
        $user = $this->userWithPermissions(canUpdate: false);
        $device = $this->createDevice();

        $this->actingAs($user)
            ->post(route('biometric-attendance.upload.store'), [
                'biometric_device_id' => $device->id,
                'file' => UploadedFile::fake()->createWithContent(
                    'attlog.txt',
                    "1001\t2026-05-21 08:30:00\t0\n",
                ),
            ])
            ->assertForbidden();
    }

    public function test_authorized_user_can_upload_attlog_file(): void
    {
        $user = $this->userWithPermissions(canUpdate: true);
        $device = $this->createDevice();
        Employee::factory()->create(['biometric_user_id' => '1001']);

        $this->actingAs($user)
            ->from(route('biometric-attendance.upload'))
            ->post(route('biometric-attendance.upload.store'), [
                'biometric_device_id' => $device->id,
                'file' => UploadedFile::fake()->createWithContent(
                    'attlog.txt',
                    "1001\t2026-05-21 08:30:00\t0\n1001\t2026-05-21 17:00:00\t1\n",
                ),
            ])
            ->assertRedirect(route('biometric-attendance.sync-logs'));

        $this->assertDatabaseCount('biometric_punches', 2);
        $this->assertDatabaseHas('biometric_sync_logs', [
            'biometric_device_id' => $device->id,
            'sync_type' => BiometricSyncType::FileUpload->value,
            'status' => BiometricSyncStatus::Completed->value,
            'inserted_count' => 2,
        ]);
    }

    public function test_authorized_user_can_upload_csv_file(): void
    {
        $user = $this->userWithPermissions(canUpdate: true);
        $device = $this->createDevice();

        $csv = <<<'CSV'
User ID,Date,Time,State
55,2026-05-22,08:00:00,Check-In
55,2026-05-22,17:30:00,Check-Out
CSV;

        $this->actingAs($user)
            ->post(route('biometric-attendance.upload.store'), [
                'biometric_device_id' => $device->id,
                'file' => UploadedFile::fake()->createWithContent('report.csv', $csv),
            ])
            ->assertRedirect(route('biometric-attendance.sync-logs'));

        $this->assertDatabaseCount('biometric_punches', 2);
        $this->assertDatabaseHas('biometric_punches', [
            'biometric_device_id' => $device->id,
            'device_user_id' => '55',
            'punched_at' => '2026-05-22 08:00:00',
        ]);
    }

    public function test_upload_rejects_inactive_device(): void
    {
        $user = $this->userWithPermissions(canUpdate: true);
        $device = $this->createDevice(isActive: false);

        $this->actingAs($user)
            ->from(route('biometric-attendance.upload'))
            ->post(route('biometric-attendance.upload.store'), [
                'biometric_device_id' => $device->id,
                'file' => UploadedFile::fake()->createWithContent(
                    'attlog.txt',
                    "1001\t2026-05-21 08:30:00\t0\n",
                ),
            ])
            ->assertRedirect(route('biometric-attendance.upload'))
            ->assertSessionHas('error');
    }

    private function userWithPermissions(bool $canUpdate): User
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::BiometricAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => $canUpdate,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        return User::factory()->create(['role_id' => $role->id]);
    }

    private function createDevice(bool $isActive = true): BiometricDevice
    {
        return BiometricDevice::query()->create([
            'name' => 'Upload Gate',
            'serial_number' => 'SN-UPLOAD-'.uniqid(),
            'connection_type' => BiometricConnectionType::AdmsPush,
            'timezone' => 'Asia/Dubai',
            'is_active' => $isActive,
        ]);
    }
}
