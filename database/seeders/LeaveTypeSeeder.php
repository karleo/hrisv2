<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

class LeaveTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $leaveTypes = [
            [
                'code' => 'AL',
                'name' => 'Annual Leave',
                'description' => 'Paid annual leave for rest and recreation',
            ],
            [
                'code' => 'SL',
                'name' => 'Sick Leave',
                'description' => 'Paid leave for illness or medical appointments',
            ],
            [
                'code' => 'ML',
                'name' => 'Maternity Leave',
                'description' => 'Leave for childbirth and maternity care',
            ],
            [
                'code' => 'PTL',
                'name' => 'Paternity Leave',
                'description' => 'Leave for fathers after childbirth',
            ],
            [
                'code' => 'PL',
                'name' => 'Personal Leave',
                'description' => 'Leave for personal matters and emergencies',
            ],
            [
                'code' => 'CL',
                'name' => 'Casual Leave',
                'description' => 'Short-term leave for casual purposes',
            ],
            [
                'code' => 'EL',
                'name' => 'Emergency Leave',
                'description' => 'Leave for unforeseen emergencies',
            ],
            [
                'code' => 'UL',
                'name' => 'Unpaid Leave',
                'description' => 'Leave without pay for extended periods',
            ],
        ];

        foreach ($leaveTypes as $leaveType) {
            LeaveType::query()->updateOrCreate(
                ['code' => $leaveType['code']],
                $leaveType
            );
        }
    }
}
