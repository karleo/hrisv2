<?php

namespace Database\Seeders;

use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use App\Models\WorkTimetable;
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
            $this->ensureEmployeesHaveWorkTimetables();

            return;
        }

        $departmentIds = Department::query()->pluck('id')->all();
        $jobPositionIds = JobPosition::query()->pluck('id')->all();
        $workTimetableId = WorkTimetable::query()->value('id');
        $companyProfileId = CompanyProfile::query()->value('id');

        Employee::factory()
            ->count(50)
            ->state(fn () => [
                'department_id' => fake()->randomElement($departmentIds),
                'job_position_id' => fake()->randomElement($jobPositionIds),
                'work_timetable_id' => $workTimetableId,
                'company_profile_id' => $companyProfileId,
            ])
            ->create();
    }

    private function ensureEmployeesHaveWorkTimetables(): void
    {
        $workTimetableId = WorkTimetable::query()->value('id');

        if ($workTimetableId === null) {
            return;
        }

        Employee::query()
            ->whereNull('work_timetable_id')
            ->update(['work_timetable_id' => $workTimetableId]);
    }
}
