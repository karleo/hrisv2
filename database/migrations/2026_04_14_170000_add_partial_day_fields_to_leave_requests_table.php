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
        Schema::table('leave_requests', function (Blueprint $table): void {
            $table->string('start_day_type', 10)->default('full')->after('period_from');
            $table->string('end_day_type', 10)->default('full')->after('period_to');
            $table->decimal('days', 5, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table): void {
            $table->dropColumn(['start_day_type', 'end_day_type']);
            $table->unsignedInteger('days')->nullable()->change();
        });
    }
};
