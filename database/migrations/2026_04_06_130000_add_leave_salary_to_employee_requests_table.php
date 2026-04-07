<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_requests', function (Blueprint $table): void {
            $table->string('leave_salary', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('employee_requests', function (Blueprint $table): void {
            $table->dropColumn('leave_salary');
        });
    }
};
