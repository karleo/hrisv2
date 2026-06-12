<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employee_time_entries', function (Blueprint $table) {
            // Work mode: work_from_home, field_driver, field_sales
            $table->string('work_mode', 32)->nullable()->after('daily_summary');

            // Check-in field evidence
            $table->text('check_in_remarks')->nullable()->after('work_mode');
            $table->string('check_in_photo_path')->nullable()->after('check_in_remarks');
            $table->decimal('check_in_latitude', 10, 7)->nullable()->after('check_in_photo_path');
            $table->decimal('check_in_longitude', 10, 7)->nullable()->after('check_in_latitude');

            // Check-out field evidence
            $table->text('check_out_remarks')->nullable()->after('check_in_longitude');
            $table->string('check_out_photo_path')->nullable()->after('check_out_remarks');
            $table->decimal('check_out_latitude', 10, 7)->nullable()->after('check_out_photo_path');
            $table->decimal('check_out_longitude', 10, 7)->nullable()->after('check_out_latitude');

            // Persisted duration fields calculated on check-out
            $table->unsignedInteger('worked_minutes')->nullable()->after('check_out_longitude');
            $table->unsignedInteger('overtime_minutes')->nullable()->after('worked_minutes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_time_entries', function (Blueprint $table) {
            $table->dropColumn([
                'work_mode',
                'check_in_remarks',
                'check_in_photo_path',
                'check_in_latitude',
                'check_in_longitude',
                'check_out_remarks',
                'check_out_photo_path',
                'check_out_latitude',
                'check_out_longitude',
                'worked_minutes',
                'overtime_minutes',
            ]);
        });
    }
};
