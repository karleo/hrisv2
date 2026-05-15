<?php

namespace Database\Seeders;

use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use App\Models\WorkTimetable;
use Illuminate\Database\Seeder;

class DemoEmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $departmentIds = Department::query()->pluck('id', 'code');
        $positionIds = JobPosition::query()->pluck('id', 'code');
        $companyProfileId = CompanyProfile::query()->value('id');
        $workTimetableId = WorkTimetable::query()
            ->where('name', 'Standard Office (Sun–Thu 9–5)')
            ->value('id')
            ?? WorkTimetable::query()->value('id');

        $employees = [
            [
                'employee_code' => 'EMP-DEMO-001',
                'first_name' => 'Ahmed',
                'last_name' => 'Al Mansoori',
                'email_address' => 'ahmed.mansoori@primelogistics.demo',
                'department_code' => 'OPS',
                'job_position_code' => 'PM',
            ],
            [
                'employee_code' => 'EMP-DEMO-002',
                'first_name' => 'Sara',
                'last_name' => 'Khan',
                'email_address' => 'sara.khan@primelogistics.demo',
                'department_code' => 'HR',
                'job_position_code' => 'HRM',
            ],
            [
                'employee_code' => 'EMP-DEMO-003',
                'first_name' => 'James',
                'last_name' => 'Wilson',
                'email_address' => 'james.wilson@primelogistics.demo',
                'department_code' => 'ENG',
                'job_position_code' => 'SD',
            ],
            [
                'employee_code' => 'EMP-DEMO-004',
                'first_name' => 'Fatima',
                'last_name' => 'Hassan',
                'email_address' => 'fatima.hassan@primelogistics.demo',
                'department_code' => 'FIN',
                'job_position_code' => 'ACC',
            ],
            [
                'employee_code' => 'EMP-DEMO-005',
                'first_name' => 'Omar',
                'last_name' => 'Saleh',
                'email_address' => 'omar.saleh@primelogistics.demo',
                'department_code' => 'MKT',
                'job_position_code' => 'MKT',
            ],
            [
                'employee_code' => 'EMP-DEMO-006',
                'first_name' => 'Emily',
                'last_name' => 'Chen',
                'email_address' => 'emily.chen@primelogistics.demo',
                'department_code' => 'SAL',
                'job_position_code' => 'SDR',
            ],
            [
                'employee_code' => 'EMP-DEMO-007',
                'first_name' => 'Cloyd',
                'last_name' => 'West',
                'email_address' => 'cloyd.west@primelogistics.demo',
                'department_code' => 'OPS',
                'job_position_code' => 'ADM',
            ],
            [
                'employee_code' => 'EMP-DEMO-008',
                'first_name' => 'Delfina',
                'last_name' => 'Hayes',
                'email_address' => 'delfina.hayes@primelogistics.demo',
                'department_code' => 'HR',
                'job_position_code' => 'ADM',
            ],
            [
                'employee_code' => 'EMP-DEMO-009',
                'first_name' => 'Vickie',
                'last_name' => 'Stark',
                'email_address' => 'vickie.stark@primelogistics.demo',
                'department_code' => 'MKT',
                'job_position_code' => 'MKT',
            ],
            [
                'employee_code' => 'EMP-DEMO-010',
                'first_name' => 'Mohammed',
                'last_name' => 'Ferry',
                'email_address' => 'mohammed.ferry@primelogistics.demo',
                'department_code' => 'OPS',
                'job_position_code' => 'SE',
            ],
            [
                'employee_code' => 'EMP-DEMO-011',
                'first_name' => 'Josiah',
                'last_name' => 'Feeney',
                'email_address' => 'josiah.feeney@primelogistics.demo',
                'department_code' => 'FIN',
                'job_position_code' => 'ACC',
            ],
            [
                'employee_code' => 'EMP-DEMO-012',
                'first_name' => 'Layla',
                'last_name' => 'Nasser',
                'email_address' => 'layla.nasser@primelogistics.demo',
                'department_code' => 'ENG',
                'job_position_code' => 'SE',
            ],
        ];

        foreach ($employees as $row) {
            $departmentId = $departmentIds[$row['department_code']]
                ?? $departmentIds->first()
                ?? Department::query()->value('id');
            $jobPositionId = $positionIds[$row['job_position_code']]
                ?? $positionIds->first()
                ?? JobPosition::query()->value('id');

            if ($departmentId === null || $jobPositionId === null) {
                continue;
            }

            Employee::query()->updateOrCreate(
                ['employee_code' => $row['employee_code']],
                [
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'email_address' => $row['email_address'],
                    'contact_number' => '+971501234567',
                    'address_1' => 'Dubai Airport Freezone, Dubai',
                    'address_2' => 'Office 12B',
                    'department_id' => $departmentId,
                    'job_position_id' => $jobPositionId,
                    'work_timetable_id' => $workTimetableId,
                    'company_profile_id' => $companyProfileId,
                    'employee_status' => 'Employed',
                    'role' => 'Employee',
                    'joining_date' => now()->subYears(2)->format('Y-m-d'),
                    'start_date' => now()->subYears(2)->format('Y-m-d'),
                    'leave_opening_balance' => 22,
                ],
            );
        }
    }
}
