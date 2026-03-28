<?php

namespace Database\Seeders;

use App\Enums\PermissionModule;
use App\Models\Role;
use App\Models\RoleModulePermission;
use App\Models\User;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $administrator = Role::query()->updateOrCreate(
            ['slug' => 'administrator'],
            [
                'name' => 'Administrator',
                'description' => 'Full access to all modules.',
                'is_system' => true,
            ]
        );

        foreach (PermissionModule::cases() as $module) {
            RoleModulePermission::query()->updateOrCreate(
                [
                    'role_id' => $administrator->id,
                    'module' => $module,
                ],
                [
                    'can_access' => true,
                    'can_view' => true,
                    'can_create' => true,
                    'can_update' => true,
                    'can_delete' => true,
                    'can_check_in' => true,
                    'can_check_out' => true,
                ]
            );
        }

        $basic = Role::query()->updateOrCreate(
            ['slug' => 'basic'],
            [
                'name' => 'Basic',
                'description' => 'Access to the dashboard only.',
                'is_system' => true,
            ]
        );

        foreach (PermissionModule::cases() as $module) {
            $isDashboard = $module === PermissionModule::Dashboard;

            RoleModulePermission::query()->updateOrCreate(
                [
                    'role_id' => $basic->id,
                    'module' => $module,
                ],
                [
                    'can_access' => $isDashboard,
                    'can_view' => $isDashboard,
                    'can_create' => false,
                    'can_update' => false,
                    'can_delete' => false,
                    'can_check_in' => false,
                    'can_check_out' => false,
                ]
            );
        }

        $employeeRole = Role::query()->updateOrCreate(
            ['slug' => 'employee'],
            [
                'name' => 'Employee',
                'description' => 'Dashboard and personal time & attendance (self check-in/out when linked to an employee).',
                'is_system' => true,
            ]
        );

        foreach (PermissionModule::cases() as $module) {
            $isDashboard = $module === PermissionModule::Dashboard;
            $isTimeAttendance = $module === PermissionModule::TimeAttendance;

            RoleModulePermission::query()->updateOrCreate(
                [
                    'role_id' => $employeeRole->id,
                    'module' => $module,
                ],
                [
                    'can_access' => $isDashboard || $isTimeAttendance,
                    'can_view' => $isDashboard || $isTimeAttendance,
                    'can_create' => false,
                    'can_update' => false,
                    'can_delete' => false,
                    'can_check_in' => false,
                    'can_check_out' => false,
                ]
            );
        }

        User::query()->whereNull('role_id')->update(['role_id' => $administrator->id]);
    }
}
