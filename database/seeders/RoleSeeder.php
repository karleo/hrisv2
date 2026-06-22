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
                    'can_verify' => true,
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
                    'can_verify' => false,
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
            $isEmployeeMessages = $module === PermissionModule::EmployeeMessages;
            $isEmployeeAssistant = $module === PermissionModule::EmployeeAssistant;
            $isPayroll = $module === PermissionModule::Payroll;

            RoleModulePermission::query()->updateOrCreate(
                [
                    'role_id' => $employeeRole->id,
                    'module' => $module,
                ],
                [
                    'can_access' => $isDashboard || $isTimeAttendance || $isEmployeeMessages || $isEmployeeAssistant || $isPayroll,
                    'can_view' => $isDashboard || $isTimeAttendance || $isEmployeeMessages || $isEmployeeAssistant || $isPayroll,
                    'can_create' => $isEmployeeMessages || $isEmployeeAssistant,
                    'can_update' => $isEmployeeMessages || $isEmployeeAssistant,
                    'can_delete' => false,
                    'can_check_in' => false,
                    'can_check_out' => false,
                    'can_verify' => false,
                ]
            );
        }

        // HR Executive: can verify attendance (step 1) and view payroll periods, no salary processing.
        $hrExecutive = Role::query()->updateOrCreate(
            ['slug' => 'hr_executive'],
            [
                'name' => 'HR Executive',
                'description' => 'Verifies employee attendance for pay periods. Cannot process salary.',
                'is_system' => true,
            ]
        );

        foreach (PermissionModule::cases() as $module) {
            $isDashboard = $module === PermissionModule::Dashboard;
            $isTimeAttendance = $module === PermissionModule::TimeAttendance;
            $isEmployeeMessages = $module === PermissionModule::EmployeeMessages;
            $isEmployeeAssistant = $module === PermissionModule::EmployeeAssistant;
            $isPayroll = $module === PermissionModule::Payroll;
            $isReports = $module === PermissionModule::Reports;
            $isEmployees = $module === PermissionModule::Employees;
            $isLeaveRequests = $module === PermissionModule::LeaveRequests;

            RoleModulePermission::query()->updateOrCreate(
                [
                    'role_id' => $hrExecutive->id,
                    'module' => $module,
                ],
                [
                    'can_access' => $isDashboard || $isTimeAttendance || $isEmployeeMessages || $isEmployeeAssistant || $isPayroll || $isReports || $isEmployees || $isLeaveRequests,
                    'can_view' => $isDashboard || $isTimeAttendance || $isEmployeeMessages || $isEmployeeAssistant || $isPayroll || $isReports || $isEmployees || $isLeaveRequests,
                    'can_create' => $isEmployeeMessages || $isEmployeeAssistant,
                    'can_update' => $isEmployeeMessages || $isEmployeeAssistant,
                    'can_delete' => false,
                    'can_check_in' => false,
                    'can_check_out' => false,
                    // HR Executive can verify attendance (step 1) on Payroll module
                    'can_verify' => $isPayroll,
                ]
            );
        }

        // Finance Executive: can verify overtime (step 2) and process salary.
        $financeExecutive = Role::query()->updateOrCreate(
            ['slug' => 'finance_executive'],
            [
                'name' => 'Finance Executive',
                'description' => 'Verifies overtime and processes salary after HR attendance verification.',
                'is_system' => true,
            ]
        );

        foreach (PermissionModule::cases() as $module) {
            $isDashboard = $module === PermissionModule::Dashboard;
            $isTimeAttendance = $module === PermissionModule::TimeAttendance;
            $isEmployeeMessages = $module === PermissionModule::EmployeeMessages;
            $isEmployeeAssistant = $module === PermissionModule::EmployeeAssistant;
            $isPayroll = $module === PermissionModule::Payroll;
            $isReports = $module === PermissionModule::Reports;
            $isEmployees = $module === PermissionModule::Employees;

            RoleModulePermission::query()->updateOrCreate(
                [
                    'role_id' => $financeExecutive->id,
                    'module' => $module,
                ],
                [
                    'can_access' => $isDashboard || $isTimeAttendance || $isEmployeeMessages || $isEmployeeAssistant || $isPayroll || $isReports || $isEmployees,
                    'can_view' => $isDashboard || $isTimeAttendance || $isEmployeeMessages || $isEmployeeAssistant || $isPayroll || $isReports || $isEmployees,
                    // Finance can create and update payroll runs (including salary processing)
                    'can_create' => $isPayroll || $isEmployeeMessages || $isEmployeeAssistant,
                    'can_update' => $isPayroll || $isEmployeeMessages || $isEmployeeAssistant,
                    'can_delete' => false,
                    'can_check_in' => false,
                    'can_check_out' => false,
                    // Finance Executive can verify overtime (step 2) on Payroll module
                    'can_verify' => $isPayroll,
                ]
            );
        }

        User::query()->whereNull('role_id')->update(['role_id' => $administrator->id]);
    }
}
