<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();
        $employeeIds = DB::table('employees')->pluck('id');

        foreach ($employeeIds as $employeeId) {
            for ($weekday = 1; $weekday <= 7; $weekday++) {
                $isRest = $weekday >= 6;

                DB::table('employee_work_schedule_days')->insert([
                    'employee_id' => $employeeId,
                    'weekday' => $weekday,
                    'is_rest_day' => $isRest,
                    'work_starts_at' => $isRest ? null : '09:00:00',
                    'work_ends_at' => $isRest ? null : '17:00:00',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('employee_work_schedule_days')->delete();
    }
};
