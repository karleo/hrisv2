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
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->date('date')->nullable()->after('details');
            $table->date('period_from')->nullable()->after('date');
            $table->date('period_to')->nullable()->after('period_from');
            $table->unsignedInteger('days')->nullable()->after('period_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn(['date', 'period_from', 'period_to', 'days']);
        });
    }
};
