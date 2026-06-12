<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biometric_push_records', function (Blueprint $table) {
            $table->id();
            $table->string('fingerprint')->unique();
            $table->string('device_serial')->nullable();
            $table->string('employee_identifier');
            $table->timestamp('punched_at');
            $table->string('raw_line');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biometric_push_records');
    }
};
