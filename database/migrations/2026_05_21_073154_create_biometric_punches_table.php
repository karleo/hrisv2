<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biometric_punches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('biometric_device_id')->constrained()->cascadeOnDelete();
            $table->string('device_user_id', 24);
            $table->foreignId('employee_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('punched_at');
            $table->string('direction')->default('unknown');
            $table->unsignedTinyInteger('verify_type')->nullable();
            $table->string('work_code')->nullable();
            $table->string('idempotency_key', 64)->unique();
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('biometric_attendance_session_id')->nullable()->constrained()->nullOnDelete();
            $table->json('raw_payload')->nullable();
            $table->timestamps();

            $table->index(['biometric_device_id', 'punched_at']);
            $table->index(['processed_at', 'punched_at']);
            $table->index(['employee_id', 'punched_at']);
        });

        Schema::table('biometric_attendance_sessions', function (Blueprint $table) {
            $table->foreignId('clock_in_punch_id')->nullable()->after('clock_out_at')->constrained('biometric_punches')->nullOnDelete();
            $table->foreignId('clock_out_punch_id')->nullable()->after('clock_in_punch_id')->constrained('biometric_punches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('biometric_attendance_sessions', function (Blueprint $table) {
            $table->dropForeign(['clock_in_punch_id']);
            $table->dropForeign(['clock_out_punch_id']);
            $table->dropColumn(['clock_in_punch_id', 'clock_out_punch_id']);
        });

        Schema::dropIfExists('biometric_punches');
    }
};
