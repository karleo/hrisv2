<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biometric_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_enabled')->default(false);
            $table->string('device_ip')->nullable();
            $table->unsignedSmallInteger('device_port')->default(4370);
            $table->string('comm_key')->nullable();
            $table->unsignedSmallInteger('timeout_seconds')->default(5);
            $table->unsignedSmallInteger('poll_interval_minutes')->default(5);
            $table->string('timezone')->default(config('app.timezone'));
            $table->unsignedSmallInteger('duplicate_window_seconds')->default(45);
            $table->unsignedSmallInteger('max_pairing_hours')->default(16);
            $table->boolean('treat_single_punch_as_open_entry')->default(true);
            $table->string('employee_identifier_field')->default('employee_code');
            $table->string('location_name')->nullable();
            $table->timestamp('last_polled_at')->nullable();
            $table->string('last_log_cursor')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biometric_settings');
    }
};
