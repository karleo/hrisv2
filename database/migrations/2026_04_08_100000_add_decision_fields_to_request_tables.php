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
            $table->text('decision_remarks')->nullable()->after('remarks');
            $table->timestamp('decided_at')->nullable()->after('decision_remarks');
        });

        Schema::table('employee_requests', function (Blueprint $table): void {
            $table->text('decision_remarks')->nullable()->after('passport_ack_home_country_departure_date_time');
            $table->timestamp('decided_at')->nullable()->after('decision_remarks');
        });

        Schema::table('it_requests', function (Blueprint $table): void {
            $table->text('decision_remarks')->nullable()->after('date');
            $table->timestamp('decided_at')->nullable()->after('decision_remarks');
        });

        Schema::table('it_asset_requests', function (Blueprint $table): void {
            $table->text('decision_remarks')->nullable()->after('remarks');
            $table->timestamp('decided_at')->nullable()->after('decision_remarks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table): void {
            $table->dropColumn(['decision_remarks', 'decided_at']);
        });

        Schema::table('employee_requests', function (Blueprint $table): void {
            $table->dropColumn(['decision_remarks', 'decided_at']);
        });

        Schema::table('it_requests', function (Blueprint $table): void {
            $table->dropColumn(['decision_remarks', 'decided_at']);
        });

        Schema::table('it_asset_requests', function (Blueprint $table): void {
            $table->dropColumn(['decision_remarks', 'decided_at']);
        });
    }
};

