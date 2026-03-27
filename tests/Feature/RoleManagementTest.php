<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_roles_index_requires_role_management_access(): void
    {
        $limited = Role::factory()->create(['name' => 'Limited', 'slug' => 'limited']);
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'role_id' => $limited->id,
        ]);

        $this->actingAs($user);

        $this->get(route('roles.index'))->assertForbidden();
    }

    public function test_administrator_can_view_roles_and_user_roles_index(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($user);

        $this->get(route('roles.index'))->assertOk();
        $this->get(route('user-roles.index'))->assertOk();
    }
}
