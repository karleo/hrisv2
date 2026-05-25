<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('biometric_attendance_sessions', function (Blueprint $table) {
            $table->index('clock_in_at');
        });
    }

    public function down(): void
    {
        Schema::table('biometric_attendance_sessions', function (Blueprint $table) {
            $table->dropIndex(['clock_in_at']);
        });
    }
};
