<?php

namespace Tests\Feature\Biometric;

use App\Enums\BiometricConnectionType;
use App\Enums\PermissionModule;
use App\Models\BiometricDevice;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use App\Services\Biometric\BiometricDeviceProbeService;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BiometricAttendanceAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_guest_cannot_access_biometric_dashboard(): void
    {
        $this->get(route('biometric-attendance.dashboard'))->assertRedirect();
    }

    public function test_user_without_permission_cannot_sync(): void
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::BiometricAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => false,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $user = User::factory()->create(['role_id' => $role->id]);
        $device = BiometricDevice::query()->create([
            'name' => 'Gate',
            'serial_number' => 'SN-ACCESS-1',
            'host' => '10.0.0.1',
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->post(route('biometric-attendance.sync'), ['biometric_device_id' => $device->id])
            ->assertForbidden();
    }

    public function test_connectivity_and_import_pages_are_accessible(): void
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::BiometricAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => false,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $user = User::factory()->create(['role_id' => $role->id]);

        $this->actingAs($user)
            ->get(route('biometric-attendance.connectivity'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('biometric-attendance/connectivity'));

        $this->actingAs($user)
            ->get(route('biometric-attendance.import'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('biometric-attendance/import'));
    }

    public function test_authorized_user_can_view_dashboard(): void
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::BiometricAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => true,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $user = User::factory()->create(['role_id' => $role->id]);

        $this->actingAs($user)
            ->get(route('biometric-attendance.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('biometric-attendance/dashboard'));
    }

    public function test_user_with_update_permission_can_create_device(): void
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::BiometricAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => true,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $user = User::factory()->create(['role_id' => $role->id]);

        $this->actingAs($user)
            ->post(route('biometric-attendance.devices.store'), [
                'name' => 'Gate device',
                'serial_number' => 'SN-TEST-CREATE-1',
                'connection_type' => 'tcp_pull',
                'host' => '192.168.1.44',
                'port' => 4370,
                'comm_key' => '1',
                'timezone' => 'Asia/Dubai',
                'is_active' => true,
            ])
            ->assertRedirect(route('biometric-attendance.dashboard'));

        $this->assertDatabaseHas('biometric_devices', [
            'serial_number' => 'SN-TEST-CREATE-1',
            'host' => '192.168.1.44',
        ]);
    }

    public function test_user_with_update_permission_can_update_device_including_active_flag(): void
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::BiometricAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_update' => true,
            'can_create' => false,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $user = User::factory()->create(['role_id' => $role->id]);
        $device = BiometricDevice::query()->create([
            'name' => 'Gate',
            'serial_number' => 'SN-UPDATE-1',
            'host' => '192.168.1.44',
            'timezone' => 'UTC',
            'is_active' => false,
        ]);

        $this->actingAs($user)
            ->from(route('biometric-attendance.dashboard'))
            ->patch(route('biometric-attendance.devices.update', $device), [
                'name' => 'Main entrance',
                'serial_number' => 'OAE7050057042700029',
                'connection_type' => 'tcp_pull',
                'host' => '192.168.1.44',
                'port' => 4370,
                'comm_key' => '1',
                'protocol' => 'udp',
                'timezone' => 'Asia/Dubai',
                'is_active' => true,
            ])
            ->assertRedirect(route('biometric-attendance.dashboard'));

        $device->refresh();

        $this->assertSame('Main entrance', $device->name);
        $this->assertSame('OAE7050057042700029', $device->serial_number);
        $this->assertTrue($device->is_active);
        $this->assertSame('Asia/Dubai', $device->timezone);
    }

    public function test_user_can_pull_attendance_for_date_range(): void
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::BiometricAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_update' => true,
            'can_create' => false,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $user = User::factory()->create(['role_id' => $role->id]);
        $device = \App\Models\BiometricDevice::query()->create([
            'name' => 'Gate',
            'serial_number' => 'SN-PULL-1',
            'host' => '192.168.1.1',
            'is_active' => true,
            'timezone' => 'UTC',
        ]);

        $fake = new \App\Services\Biometric\Connectors\FakeBiometricConnector;
        $fake->setPunches(
            new \App\Services\Biometric\BiometricPunchData(
                '10',
                \Illuminate\Support\Carbon::parse('2026-05-20 08:00:00'),
                \App\Enums\BiometricPunchDirection::In,
                rawStatus: 0,
            ),
            new \App\Services\Biometric\BiometricPunchData(
                '10',
                \Illuminate\Support\Carbon::parse('2026-05-20 17:00:00'),
                \App\Enums\BiometricPunchDirection::Out,
                rawStatus: 1,
            ),
            new \App\Services\Biometric\BiometricPunchData(
                '10',
                \Illuminate\Support\Carbon::parse('2026-06-01 08:00:00'),
                \App\Enums\BiometricPunchDirection::In,
                rawStatus: 0,
            ),
        );

        $this->mock(\App\Services\Biometric\BiometricConnectorFactory::class, function ($mock) use ($fake): void {
            $mock->shouldReceive('forDevice')->andReturn($fake);
        });

        \App\Models\Employee::factory()->create(['biometric_user_id' => '10']);

        $this->actingAs($user)
            ->from(route('biometric-attendance.sync-logs'))
            ->post(route('biometric-attendance.sync'), [
                'biometric_device_id' => $device->id,
                'from' => '2026-05-20',
                'to' => '2026-05-20',
            ])
            ->assertRedirect(route('biometric-attendance.sync-logs'));

        $this->assertDatabaseCount('biometric_punches', 2);
        $this->assertDatabaseCount('biometric_attendance_sessions', 1);
    }

    public function test_test_connection_with_json_returns_quick_result(): void
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::BiometricAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => true,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $user = User::factory()->create(['role_id' => $role->id]);
        $device = BiometricDevice::query()->create([
            'name' => 'ADMS Gate',
            'serial_number' => 'SN-TEST-CONN-1',
            'connection_type' => BiometricConnectionType::AdmsPush,
            'is_active' => true,
            'metadata' => ['last_adms_push_at' => now()->toIso8601String()],
        ]);

        $this->actingAs($user)
            ->postJson("/biometric-attendance/devices/{$device->id}/test")
            ->assertOk()
            ->assertJson([
                'ok' => true,
            ])
            ->assertJsonStructure(['message']);
    }

    public function test_tcp_pull_import_fails_fast_when_device_unreachable(): void
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::BiometricAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => true,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $user = User::factory()->create(['role_id' => $role->id]);
        $device = BiometricDevice::query()->create([
            'name' => 'TCP Gate',
            'serial_number' => 'SN-TCP-FAIL-1',
            'connection_type' => BiometricConnectionType::TcpPull,
            'host' => '192.168.1.44',
            'port' => 4370,
            'is_active' => true,
        ]);

        $this->mock(BiometricDeviceProbeService::class, function ($mock): void {
            $mock->shouldReceive('quickProbe')->andReturn([
                'pull_can_connect' => false,
                'recommendation' => 'Use ADMS push instead.',
            ]);
        });

        $this->actingAs($user)
            ->postJson(route('biometric-attendance.sync'), [
                'biometric_device_id' => $device->id,
                'from' => '2026-05-17',
                'to' => '2026-05-19',
            ])
            ->assertStatus(422)
            ->assertJson([
                'ok' => false,
                'message' => 'Use ADMS push instead.',
            ]);

        $this->assertDatabaseHas('biometric_sync_logs', [
            'biometric_device_id' => $device->id,
            'status' => 'failed',
            'error_message' => 'Use ADMS push instead.',
        ]);
    }

    public function test_sync_with_json_accept_returns_sync_log_id(): void
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::BiometricAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => true,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $user = User::factory()->create(['role_id' => $role->id]);
        $device = BiometricDevice::query()->create([
            'name' => 'ADMS Gate',
            'serial_number' => 'SN-JSON-SYNC-1',
            'connection_type' => BiometricConnectionType::AdmsPush,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->postJson(route('biometric-attendance.sync'), [
                'biometric_device_id' => $device->id,
                'from' => '2026-05-14',
                'to' => '2026-05-21',
            ])
            ->assertOk()
            ->assertJsonStructure(['sync_log_id', 'message']);
    }

    public function test_authorized_user_can_poll_sync_status(): void
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::BiometricAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_update' => true,
            'can_create' => false,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $user = User::factory()->create(['role_id' => $role->id]);
        $device = BiometricDevice::query()->create([
            'name' => 'Gate',
            'serial_number' => 'SN-STATUS-1',
            'host' => '192.168.1.1',
            'is_active' => true,
        ]);

        $log = \App\Models\BiometricSyncLog::query()->create([
            'biometric_device_id' => $device->id,
            'sync_type' => \App\Enums\BiometricSyncType::Manual,
            'status' => \App\Enums\BiometricSyncStatus::Running,
            'started_at' => now(),
        ]);

        $this->actingAs($user)
            ->getJson(route('biometric-attendance.sync-status', ['sync_log_id' => $log->id]))
            ->assertOk()
            ->assertJson([
                'id' => $log->id,
                'status' => 'running',
                'is_running' => true,
            ]);
    }
}
