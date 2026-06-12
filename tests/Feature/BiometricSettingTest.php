<?php

namespace Tests\Feature;

use App\Enums\PermissionModule;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BiometricSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_time_attendance_update_can_manage_biometric_settings(): void
    {
        $role = Role::factory()->create();
        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::TimeAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => true,
            'can_delete' => false,
            'can_check_in' => false,
            'can_check_out' => false,
        ]);

        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('biometric-settings.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('biometric-settings/index'));

        $this->actingAs($user)
            ->put(route('biometric-settings.update'), [
                'is_enabled' => true,
                'device_ip' => '192.168.1.201',
                'device_port' => 4370,
                'comm_key' => '1234',
                'timeout_seconds' => 5,
                'poll_interval_minutes' => 10,
                'timezone' => 'Asia/Manila',
                'duplicate_window_seconds' => 45,
                'max_pairing_hours' => 16,
                'treat_single_punch_as_open_entry' => true,
                'employee_identifier_field' => 'employee_code',
                'location_name' => 'Main Office',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('biometric-settings.index'));

        $this->assertDatabaseHas('biometric_settings', [
            'is_enabled' => true,
            'device_ip' => '192.168.1.201',
            'location_name' => 'Main Office',
        ]);
    }

    public function test_user_without_permission_cannot_view_or_update_biometric_settings(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->get(route('biometric-settings.index'))
            ->assertForbidden();

        $this->actingAs($user)
            ->put(route('biometric-settings.update'), [
                'is_enabled' => true,
                'device_port' => 4370,
                'timeout_seconds' => 5,
                'poll_interval_minutes' => 10,
                'timezone' => 'Asia/Manila',
                'duplicate_window_seconds' => 45,
                'max_pairing_hours' => 16,
                'treat_single_punch_as_open_entry' => true,
                'employee_identifier_field' => 'employee_code',
            ])
            ->assertForbidden();
    }
}
