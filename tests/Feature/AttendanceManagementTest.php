<?php

namespace Tests\Feature;

use App\Enums\AttendanceWorkMode;
use App\Models\CompanyProfile;
use App\Models\Employee;
use App\Models\EmployeeTimeEntry;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->withoutVite();
    }

    public function test_hr_executive_can_view_attendance_management_with_summary(): void
    {
        $company = CompanyProfile::factory()->create(['company_name' => 'Prime Logistics']);
        $hrEmployee = Employee::factory()->create(['company_profile_id' => $company->id]);
        $hrUser = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'hr_executive')->value('id'),
            'email_verified_at' => now(),
        ]);
        $hrEmployee->update(['user_id' => $hrUser->id]);

        $employee = Employee::factory()->create(['company_profile_id' => $company->id]);
        $clockIn = now()->subDay()->setTime(8, 0);
        $clockOut = now()->subDay()->setTime(18, 0);

        EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => $clockIn,
            'clock_out_at' => $clockOut,
            'work_mode' => AttendanceWorkMode::WorkFromHome->value,
            'worked_minutes' => 600,
            'overtime_minutes' => 120,
        ]);

        $this->actingAs($hrUser)
            ->get(route('attendance-management.index', [
                'from' => $clockIn->toDateString(),
                'to' => $clockIn->toDateString(),
                'company_profile_id' => $company->id,
                'source' => 'manual',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('attendance-management/index')
                ->where('canManageEntries', true)
                ->has('summary.total_overtime_minutes')
                ->where('rows.data.0.source', 'manual')
                ->where('rows.data.0.company_name', 'Prime Logistics')
                ->where('rows.data.0.employee_id', $employee->id));
    }

    public function test_legacy_reports_attendance_route_redirects_to_management(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($admin)
            ->get(route('reports.attendance', ['from' => '2026-06-01', 'to' => '2026-06-30']))
            ->assertRedirect(route('attendance-management.index', [
                'from' => '2026-06-01',
                'to' => '2026-06-30',
            ]));
    }
}
