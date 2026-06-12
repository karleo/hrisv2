<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biometric_attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('biometric_device_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('clock_in_at');
            $table->dateTime('clock_out_at')->nullable();
            $table->unsignedInteger('working_minutes')->nullable();
            $table->boolean('is_open')->default(true);
            $table->timestamps();

            $table->index(['employee_id', 'clock_in_at']);
            $table->index(['is_open', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biometric_attendance_sessions');
    }
};
