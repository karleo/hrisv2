<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            [
                'code' => 'ENG',
                'name' => 'Engineering',
                'description' => 'Software development, product engineering, and technical operations',
            ],
            [
                'code' => 'HR',
                'name' => 'Human Resources',
                'description' => 'Recruitment, employee relations, benefits, and workplace policies',
            ],
            [
                'code' => 'FIN',
                'name' => 'Finance',
                'description' => 'Accounting, budgeting, financial planning, and reporting',
            ],
            [
                'code' => 'OPS',
                'name' => 'Operations',
                'description' => 'Day-to-day business operations and process management',
            ],
            [
                'code' => 'MKT',
                'name' => 'Marketing',
                'description' => 'Brand management, digital marketing, and communications',
            ],
            [
                'code' => 'SAL',
                'name' => 'Sales',
                'description' => 'Business development, customer acquisition, and account management',
            ],
        ];

        foreach ($departments as $department) {
            Department::query()->updateOrCreate(
                ['code' => $department['code']],
                $department
            );
        }
    }
}
