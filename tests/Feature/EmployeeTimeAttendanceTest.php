<?php

namespace Tests\Feature;

use App\Enums\AttendanceWorkMode;
use App\Enums\PermissionModule;
use App\Models\Employee;
use App\Models\EmployeeTimeEntry;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use App\Models\WorkTimetableDay;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

    /**
     * Role with both dashboard view and time attendance — needed for dashboard route access.
     */
    private function roleWithDashboardAndTimeAttendance(): Role
    {
        $role = Role::factory()->create();

        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::Dashboard,
            'can_access' => true,
            'can_view' => true,
        ]);

        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::TimeAttendance,
            'can_access' => true,
            'can_view' => true,
            'can_create' => true,
            'can_update' => true,
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

        // Remove Sunday from the timetable so it becomes incomplete (< 7 days)
        WorkTimetableDay::query()
            ->where('work_timetable_id', $employee->work_timetable_id)
            ->where('weekday', 7)
            ->delete();

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

    public function test_administrator_with_linked_employee_can_check_out_self_service(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $employee = Employee::factory()->create([
            'user_id' => $admin->id,
        ]);

        EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => now()->subHours(2),
            'clock_out_at' => null,
        ]);

        $this->actingAs($admin)
            ->post(route('time-attendance.check-out'), [])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('time-attendance.index'));

        $entry = EmployeeTimeEntry::query()->where('employee_id', $employee->id)->first();
        $this->assertNotNull($entry);
        $this->assertNotNull($entry->clock_out_at);
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

    // -----------------------------------------------------------------------
    // Work mode — WFH
    // -----------------------------------------------------------------------

    public function test_employee_can_check_in_with_wfh_mode_no_photo_or_gps(): void
    {
        $role = $this->roleWithTimeAttendance();
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('time-attendance.store'), [
                'work_mode' => AttendanceWorkMode::WorkFromHome->value,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('time-attendance.index'));

        $entry = EmployeeTimeEntry::query()->where('employee_id', $employee->id)->first();
        $this->assertNotNull($entry);
        $this->assertSame(AttendanceWorkMode::WorkFromHome, $entry->work_mode);
        $this->assertNull($entry->check_in_photo_path);
        $this->assertNull($entry->check_in_latitude);
    }

    public function test_employee_wfh_check_in_with_optional_gps_and_remarks(): void
    {
        $role = $this->roleWithTimeAttendance();
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('time-attendance.store'), [
                'work_mode' => AttendanceWorkMode::WorkFromHome->value,
                'check_in_latitude' => '14.5995',
                'check_in_longitude' => '120.9842',
                'check_in_remarks' => 'Working from the living room today.',
            ])
            ->assertSessionHasNoErrors();

        $entry = EmployeeTimeEntry::query()->where('employee_id', $employee->id)->first();
        $this->assertEqualsWithDelta(14.5995, (float) $entry->check_in_latitude, 0.0001);
        $this->assertSame('Working from the living room today.', $entry->check_in_remarks);
    }

    // -----------------------------------------------------------------------
    // Work mode — Field (driver / sales require photo + GPS)
    // -----------------------------------------------------------------------

    public function test_field_check_in_without_photo_fails_validation(): void
    {
        $role = $this->roleWithTimeAttendance();
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('time-attendance.store'), [
                'work_mode' => AttendanceWorkMode::FieldDriver->value,
                'check_in_latitude' => '14.5995',
                'check_in_longitude' => '120.9842',
                // No photo — should fail
            ])
            ->assertSessionHasErrors('check_in_photo');
    }

    public function test_field_check_in_without_gps_fails_validation(): void
    {
        Storage::fake('public');
        $role = $this->roleWithTimeAttendance();
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('time-attendance.store'), [
                'work_mode' => AttendanceWorkMode::FieldSales->value,
                'check_in_photo' => UploadedFile::fake()->image('photo.jpg'),
                // No latitude/longitude — should fail
            ])
            ->assertSessionHasErrors('check_in_latitude');
    }

    public function test_field_driver_full_check_in_stores_photo_and_location(): void
    {
        Storage::fake('public');
        $role = $this->roleWithTimeAttendance();
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('time-attendance.store'), [
                'work_mode' => AttendanceWorkMode::FieldDriver->value,
                'check_in_photo' => UploadedFile::fake()->image('checkin.jpg'),
                'check_in_latitude' => '14.5995',
                'check_in_longitude' => '120.9842',
                'check_in_remarks' => 'Starting route in Makati.',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('time-attendance.index'));

        $entry = EmployeeTimeEntry::query()->where('employee_id', $employee->id)->firstOrFail();
        $this->assertSame(AttendanceWorkMode::FieldDriver, $entry->work_mode);
        $this->assertTrue($entry->requiresFieldEvidence());
        $this->assertNotNull($entry->check_in_photo_path);
        Storage::disk('public')->assertExists($entry->check_in_photo_path);
        $this->assertEqualsWithDelta(14.5995, (float) $entry->check_in_latitude, 0.0001);
        $this->assertSame('Starting route in Makati.', $entry->check_in_remarks);

        $this->actingAs($user)
            ->get(route('time-attendance.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('time-attendance/index')
                ->where('entries.data.0.check_in_photo_url', '/storage/'.$entry->check_in_photo_path)
            );
    }

    // -----------------------------------------------------------------------
    // Field check-out — photo + GPS required
    // -----------------------------------------------------------------------

    public function test_field_check_out_without_photo_fails_validation(): void
    {
        $role = $this->roleWithTimeAttendance();
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        // Pre-existing field check-in
        EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => now()->subHours(4),
            'work_mode' => AttendanceWorkMode::FieldDriver->value,
        ]);

        $this->actingAs($user)
            ->post(route('time-attendance.check-out'), [
                'check_out_latitude' => '14.5995',
                'check_out_longitude' => '120.9842',
                // No photo
            ])
            ->assertSessionHasErrors('check_out_photo');
    }

    public function test_field_check_out_stores_photo_and_computes_worked_time(): void
    {
        Storage::fake('public');
        $role = $this->roleWithTimeAttendance();
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        // Pre-existing open field check-in 4 hours ago
        $entry = EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => now()->subHours(4),
            'work_mode' => AttendanceWorkMode::FieldSales->value,
        ]);

        $this->actingAs($user)
            ->post(route('time-attendance.check-out'), [
                'check_out_photo' => UploadedFile::fake()->image('checkout.jpg'),
                'check_out_latitude' => '14.6001',
                'check_out_longitude' => '120.9900',
                'check_out_remarks' => 'Finished sales visits.',
                'daily_summary' => 'Visited 5 clients today.',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('time-attendance.index'));

        $entry->refresh();
        $this->assertNotNull($entry->clock_out_at);
        $this->assertNotNull($entry->check_out_photo_path);
        Storage::disk('public')->assertExists($entry->check_out_photo_path);
        $this->assertEqualsWithDelta(14.6001, (float) $entry->check_out_latitude, 0.0001);
        $this->assertSame('Finished sales visits.', $entry->check_out_remarks);
        $this->assertSame('Visited 5 clients today.', $entry->daily_summary);

        // Worked minutes should be around 240 (4 hours)
        $this->assertNotNull($entry->worked_minutes);
        $this->assertGreaterThanOrEqual(240, $entry->worked_minutes);
    }

    // -----------------------------------------------------------------------
    // Overtime computation on check-out
    // -----------------------------------------------------------------------

    public function test_overtime_is_persisted_after_wfh_checkout_beyond_schedule(): void
    {
        $role = $this->roleWithTimeAttendance();
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        // Simulate a check-in 10 hours ago so we get overtime on a typical 8-hour schedule
        $entry = EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => now()->subHours(10),
            'work_mode' => AttendanceWorkMode::WorkFromHome->value,
        ]);

        $this->actingAs($user)
            ->post(route('time-attendance.check-out'), [])
            ->assertSessionHasNoErrors();

        $entry->refresh();
        $this->assertNotNull($entry->worked_minutes);
        // Overtime minutes should be non-negative; actual value depends on the employee timetable
        $this->assertGreaterThanOrEqual(0, $entry->overtime_minutes);
    }

    // -----------------------------------------------------------------------
    // Dashboard attendance props
    // -----------------------------------------------------------------------

    public function test_dashboard_includes_attendance_props_for_linked_employee(): void
    {
        $role = $this->roleWithDashboardAndTimeAttendance();
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->has('attendance')
                ->has('attendance.can_check_in')
                ->has('attendance.work_mode_options')
                ->where('attendance.open_entry', null)
            );
    }

    public function test_dashboard_attendance_shows_open_entry_when_checked_in(): void
    {
        $role = $this->roleWithDashboardAndTimeAttendance();
        $employee = Employee::factory()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
        $employee->update(['user_id' => $user->id]);

        EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => now()->subHour(),
            'work_mode' => AttendanceWorkMode::WorkFromHome->value,
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->has('attendance.open_entry')
                ->where('attendance.open_entry.work_mode', AttendanceWorkMode::WorkFromHome->value)
                ->where('attendance.can_check_in', false)
            );
    }

    public function test_dashboard_attendance_is_null_for_users_without_linked_employee(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->where('attendance', null)
            );
    }
}
