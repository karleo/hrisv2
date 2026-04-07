<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_requests', function (Blueprint $table): void {
            $table->string('dept_head_signature')->nullable();
            $table->string('ceo_signature')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('employee_requests', function (Blueprint $table): void {
            $table->dropColumn([
                'dept_head_signature',
                'ceo_signature',
            ]);
        });
    }
};
