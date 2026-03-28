<?php

namespace Tests\Feature;

use App\Enums\PermissionModule;
use App\Models\Employee;
use App\Models\EmployeeTimeEntry;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeTimeAttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    private function roleWithTimeAttendance(bool $canDelete = false): Role
    {
        $role = Role::factory()->create();

        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::TimeAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => true,
            'can_update' => true,
            'can_delete' => $canDelete,
        ]);

        return $role;
    }

    public function test_guest_cannot_view_time_attendance(): void
    {
        $this->get(route('time-attendance.index'))->assertRedirect();
    }

    public function test_administrator_can_check_in_and_patch_check_out(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $employee = Employee::factory()->create();

        $this->actingAs($admin)
            ->post(route('time-attendance.store'), [
                'employee_id' => $employee->id,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('time-attendance.index'));

        $entry = EmployeeTimeEntry::query()->where('employee_id', $employee->id)->first();
        $this->assertNotNull($entry);
        $this->assertNull($entry->clock_out_at);

        $out = now()->addHours(8);

        $this->actingAs($admin)
            ->patch(route('time-attendance.update', $entry), [
                'clock_out_at' => $out->toDateTimeString(),
                'daily_summary' => 'Completed onboarding docs.',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('time-attendance.index'));

        $entry->refresh();
        $this->assertEquals($out->format('Y-m-d H:i'), $entry->clock_out_at->format('Y-m-d H:i'));
        $this->assertSame('Completed onboarding docs.', $entry->daily_summary);
    }

    public function test_second_check_in_rejected_while_open_entry_exists(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $employee = Employee::factory()->create();

        $this->actingAs($admin)
            ->post(route('time-attendance.store'), ['employee_id' => $employee->id])
            ->assertRedirect(route('time-attendance.index'));

        $this->actingAs($admin)
            ->post(route('time-attendance.store'), ['employee_id' => $employee->id])
            ->assertSessionHasErrors('check_in');
    }

    public function test_check_in_rejected_when_schedule_incomplete(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $employee = Employee::factory()->create();
        $employee->workScheduleDays()->where('weekday', 7)->delete();

        $this->actingAs($admin)
            ->post(route('time-attendance.store'), ['employee_id' => $employee->id])
            ->assertSessionHasErrors('check_in');
    }

    public function test_employee_can_check_out_with_optional_summary(): void
    {
        $role = $this->roleWithTimeAttendance();
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => now()->subHours(2),
            'clock_out_at' => null,
        ]);

        $this->actingAs($user)
            ->post(route('time-attendance.check-out'), [])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('time-attendance.index'));

        $entry = EmployeeTimeEntry::query()->where('employee_id', $employee->id)->first();
        $this->assertNotNull($entry->clock_out_at);
        $this->assertNull($entry->daily_summary);
    }

    public function test_linked_employee_index_only_shows_own_entries(): void
    {
        $role = $this->roleWithTimeAttendance();
        $employeeA = Employee::factory()->create();
        $employeeB = Employee::factory()->create();
        $userA = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employeeA->update(['user_id' => $userA->id]);

        EmployeeTimeEntry::query()->create([
            'employee_id' => $employeeA->id,
            'clock_in_at' => now()->subDay(),
            'clock_out_at' => now()->subDay()->addHours(4),
        ]);
        EmployeeTimeEntry::query()->create([
            'employee_id' => $employeeB->id,
            'clock_in_at' => now()->subDay(),
            'clock_out_at' => now()->subDay()->addHours(3),
        ]);

        $this->actingAs($userA)
            ->get(route('time-attendance.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('time-attendance/index')
                ->has('entries.data', 1)
                ->where('entries.data.0.employee_id', $employeeA->id)
            );
    }

    public function test_non_admin_cannot_delete_time_entry(): void
    {
        $role = $this->roleWithTimeAttendance(canDelete: false);
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        $entry = EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => now(),
            'clock_out_at' => now()->addHour(),
        ]);

        $this->actingAs($user)
            ->delete(route('time-attendance.destroy', $entry))
            ->assertForbidden();
    }

    public function test_administrator_can_delete_time_entry(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $employee = Employee::factory()->create();
        $entry = EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => now(),
            'clock_out_at' => now()->addHour(),
        ]);

        $this->actingAs($admin)
            ->delete(route('time-attendance.destroy', $entry))
            ->assertRedirect(route('time-attendance.index'));

        $this->assertDatabaseMissing('employee_time_entries', ['id' => $entry->id]);
    }
}
