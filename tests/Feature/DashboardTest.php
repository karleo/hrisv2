<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_authenticated_user_with_employee_profile_receives_employee_id_in_shared_auth(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('profile.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('auth.employee_id', $employee->id));
    }

    public function test_users_without_dashboard_permission_are_redirected_from_dashboard(): void
    {
        $role = Role::factory()->create([
            'name' => 'No dashboard',
            'slug' => 'no-dashboard',
        ]);

        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user);

        $this->get(route('dashboard'))
            ->assertRedirect(route('profile.edit'));
    }
}
