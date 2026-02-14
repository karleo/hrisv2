<?php

namespace Database\Seeders;

use App\Models\JobPosition;
use Illuminate\Database\Seeder;

class JobPositionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jobPositions = [
            [
                'code' => 'SE',
                'name' => 'Software Engineer',
                'description' => 'Develops and maintains software applications and systems',
            ],
            [
                'code' => 'SD',
                'name' => 'Senior Developer',
                'description' => 'Lead development efforts and mentor junior engineers',
            ],
            [
                'code' => 'PM',
                'name' => 'Project Manager',
                'description' => 'Plans, executes, and closes projects within scope and budget',
            ],
            [
                'code' => 'HRM',
                'name' => 'HR Manager',
                'description' => 'Oversees recruitment, employee relations, and HR policies',
            ],
            [
                'code' => 'ACC',
                'name' => 'Accountant',
                'description' => 'Manages financial records, reporting, and compliance',
            ],
            [
                'code' => 'MKT',
                'name' => 'Marketing Specialist',
                'description' => 'Develops and executes marketing campaigns and strategies',
            ],
            [
                'code' => 'SDR',
                'name' => 'Sales Representative',
                'description' => 'Drives revenue through customer acquisition and account management',
            ],
            [
                'code' => 'ADM',
                'name' => 'Administrative Assistant',
                'description' => 'Provides administrative support and office coordination',
            ],
        ];

        foreach ($jobPositions as $jobPosition) {
            JobPosition::query()->updateOrCreate(
                ['code' => $jobPosition['code']],
                $jobPosition
            );
        }
    }
}
