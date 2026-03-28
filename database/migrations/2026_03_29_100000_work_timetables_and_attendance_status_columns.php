<?php

use App\Models\EmployeeTimeEntry;
use App\Services\AttendanceClassificationService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('work_timetables', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('work_timetable_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_timetable_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('weekday');
            $table->boolean('is_rest_day')->default(false);
            $table->time('work_starts_at')->nullable();
            $table->time('work_ends_at')->nullable();
            $table->timestamps();

            $table->unique(['work_timetable_id', 'weekday']);
        });

        $now = now();
        $timetableId = DB::table('work_timetables')->insertGetId([
            'name' => 'Standard office (Mon–Fri 9:00–17:00)',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        for ($weekday = 1; $weekday <= 7; $weekday++) {
            $isRest = $weekday >= 6;
            DB::table('work_timetable_days')->insert([
                'work_timetable_id' => $timetableId,
                'weekday' => $weekday,
                'is_rest_day' => $isRest,
                'work_starts_at' => $isRest ? null : '09:00:00',
                'work_ends_at' => $isRest ? null : '17:00:00',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('work_timetable_id')
                ->nullable()
                ->constrained('work_timetables')
                ->restrictOnDelete();
        });

        if (Schema::hasTable('employees')) {
            DB::table('employees')->whereNull('work_timetable_id')->update([
                'work_timetable_id' => $timetableId,
            ]);
        }

        if (! Schema::hasTable('employee_time_entries')) {
            Schema::create('employee_time_entries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
                $table->dateTime('clock_in_at');
                $table->dateTime('clock_out_at')->nullable();
                $table->text('daily_summary')->nullable();
                $table->string('check_in_status', 32)->nullable();
                $table->string('check_out_status', 32)->nullable();
                $table->timestamps();

                $table->index(['employee_id', 'clock_in_at']);
            });
        } elseif (! Schema::hasColumn('employee_time_entries', 'check_in_status')) {
            Schema::table('employee_time_entries', function (Blueprint $table) {
                $table->string('check_in_status', 32)->nullable();
                $table->string('check_out_status', 32)->nullable();
            });
        }

        Schema::dropIfExists('employee_work_schedule_days');

        if (Schema::hasTable('employee_time_entries')) {
            $service = app(AttendanceClassificationService::class);
            EmployeeTimeEntry::query()->each(function (EmployeeTimeEntry $entry) use ($service): void {
                $entry->recalculateAttendanceStatuses($service);
                $entry->saveQuietly();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('employee_time_entries') && Schema::hasColumn('employee_time_entries', 'check_in_status')) {
            Schema::table('employee_time_entries', function (Blueprint $table) {
                $table->dropColumn(['check_in_status', 'check_out_status']);
            });
        }

        Schema::table('employees', function (Blueprint $table) {
            $table->dropConstrainedForeignId('work_timetable_id');
        });

        Schema::dropIfExists('work_timetable_days');
        Schema::dropIfExists('work_timetables');
    }
};
