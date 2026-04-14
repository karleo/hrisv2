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
                'leave_category' => 'paid',
                'description' => 'Paid annual leave for rest and recreation',
            ],
            [
                'code' => 'SL',
                'name' => 'Sick Leave',
                'leave_category' => 'paid',
                'description' => 'Paid leave for illness or medical appointments',
            ],
            [
                'code' => 'ML',
                'name' => 'Maternity Leave',
                'leave_category' => 'paid',
                'description' => 'Leave for childbirth and maternity care',
            ],
            [
                'code' => 'PTL',
                'name' => 'Paternity Leave',
                'leave_category' => 'paid',
                'description' => 'Leave for fathers after childbirth',
            ],
            [
                'code' => 'PL',
                'name' => 'Personal Leave',
                'leave_category' => 'paid',
                'description' => 'Leave for personal matters and emergencies',
            ],
            [
                'code' => 'CL',
                'name' => 'Casual Leave',
                'leave_category' => 'paid',
                'description' => 'Short-term leave for casual purposes',
            ],
            [
                'code' => 'EL',
                'name' => 'Emergency Leave',
                'leave_category' => 'paid',
                'description' => 'Leave for unforeseen emergencies',
            ],
            [
                'code' => 'UL',
                'name' => 'Unpaid Leave',
                'leave_category' => 'unpaid',
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
