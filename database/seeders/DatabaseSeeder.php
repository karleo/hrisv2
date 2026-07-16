<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            RoleSeeder::class,
            DepartmentSeeder::class,
            JobPositionSeeder::class,
            CountrySeeder::class,
            CompanyProfileSeeder::class,
            LeaveTypeSeeder::class,
            SoftwareSeeder::class,
            HardwareSeeder::class,
            DocumentTypeSeeder::class,
            PayComponentTypeSeeder::class,
            AppVersionSeeder::class,
            WorkTimetableSeeder::class,
            BiometricDeviceSeeder::class,
            EmployeeSeeder::class,
            DemoEmployeeSeeder::class,
            HardwareAssetValueSeeder::class,
            AccessorySeeder::class,
            ItAssetSeeder::class,
            LeaveRequestSeeder::class,
        ]);

        $administratorRoleId = Role::query()->where('slug', 'administrator')->value('id');
        $employeeRoleId = Role::query()->where('slug', 'employee')->value('id');

        $testUser = User::query()->firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'remember_token' => Str::random(10),
                'role_id' => $administratorRoleId,
            ]
        );

        $testUser->forceFill([
            'name' => 'Test User',
            'is_active' => true,
            'role_id' => $administratorRoleId,
        ])->save();

        $chatUser = User::query()->firstOrCreate(
            ['email' => 'chat@example.com'],
            [
                'name' => 'Chat Demo User',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'remember_token' => Str::random(10),
                'role_id' => $employeeRoleId,
            ]
        );

        $chatUser->forceFill([
            'name' => 'Chat Demo User',
            'is_active' => true,
            'role_id' => $employeeRoleId,
        ])->save();

        Employee::query()
            ->whereNull('user_id')
            ->orderBy('id')
            ->limit(2)
            ->get()
            ->values()
            ->each(function (Employee $employee, int $index) use ($testUser, $chatUser): void {
                $employee->forceFill([
                    'user_id' => $index === 0 ? $testUser->id : $chatUser->id,
                ])->save();
            });

        $demoChat = Employee::query()
            ->where('employee_code', 'EMP-DEMO-007')
            ->first();

        if ($demoChat !== null && $demoChat->user_id === null) {
            $demoChat->forceFill(['user_id' => $chatUser->id])->save();
        }

        $demoAdmin = Employee::query()
            ->where('employee_code', 'EMP-DEMO-003')
            ->first();

        if ($demoAdmin !== null && $demoAdmin->user_id === null) {
            $demoAdmin->forceFill(['user_id' => $testUser->id])->save();
        }
    }
}
