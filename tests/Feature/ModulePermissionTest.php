<?php

namespace Tests\Feature;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModulePermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_limited_to_department_view_cannot_create_departments(): void
    {
        $role = Role::factory()->create([
            'name' => 'Departments viewer',
            'slug' => 'depts-view',
        ]);

        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::Departments,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => false,
            'can_delete' => false,
        ]);

        $user = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user);

        $this->get(route('departments.index'))->assertOk();
        $this->get(route('departments.create'))->assertForbidden();
    }

    public function test_user_without_role_cannot_access_protected_modules(): void
    {
        $user = User::factory()->create([
            'role_id' => null,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user);

        $this->get(route('dashboard'))->assertForbidden();
        $this->get(route('departments.index'))->assertForbidden();
    }

    public function test_administrator_factory_user_can_access_dashboard_and_departments(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->assertTrue($user->isAdministrator());

        $this->actingAs($user);

        $this->get(route('dashboard'))->assertOk();
        $this->get(route('departments.index'))->assertOk();
    }

    public function test_administrator_can_access_all_modules_without_permission_rows(): void
    {
        $adminRole = Role::query()->where('slug', 'administrator')->firstOrFail();
        $adminRole->modulePermissions()->delete();

        $user = User::factory()->create([
            'role_id' => $adminRole->id,
            'email_verified_at' => now(),
        ]);

        $this->assertTrue($user->isAdministrator());
        $this->assertTrue(
            $user->hasModuleAbility(PermissionModule::Departments, ModuleAbility::Delete)
        );

        $this->actingAs($user);

        $this->get(route('departments.index'))->assertOk();
        $this->get(route('departments.create'))->assertOk();
    }

    public function test_has_module_ability_matches_role_permissions(): void
    {
        $role = Role::factory()->create();

        RoleModulePermission::query()->create([
            'role_id' => $role->id,
            'module' => PermissionModule::Software,
            'can_access' => true,
            'can_view' => true,
            'can_create' => false,
            'can_update' => true,
            'can_delete' => false,
        ]);

        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($user->hasModuleAbility(PermissionModule::Software, ModuleAbility::View));
        $this->assertFalse($user->hasModuleAbility(PermissionModule::Software, ModuleAbility::Create));
        $this->assertTrue($user->hasModuleAbility(PermissionModule::Software, ModuleAbility::Update));
        $this->assertFalse($user->hasModuleAbility(PermissionModule::Employees, ModuleAbility::View));
    }
}
