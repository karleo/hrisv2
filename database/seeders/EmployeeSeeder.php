<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            DepartmentSeeder::class,
            JobPositionSeeder::class,
        ]);

        if (Employee::query()->exists()) {
            return;
        }

        $departmentIds = Department::query()->pluck('id')->all();
        $jobPositionIds = JobPosition::query()->pluck('id')->all();

        Employee::factory()
            ->count(50)
            ->state(fn () => [
                'department_id' => fake()->randomElement($departmentIds),
                'job_position_id' => fake()->randomElement($jobPositionIds),
            ])
            ->create();
    }
}
