<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_requests', function (Blueprint $table): void {
            $table->string('passport_ack_airline_name', 255)->nullable();
            $table->string('passport_ack_home_country', 255)->nullable();
            $table->string('passport_ack_departure_date_time', 255)->nullable();
            $table->string('passport_ack_home_country_departure_date_time', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('employee_requests', function (Blueprint $table): void {
            $table->dropColumn([
                'passport_ack_airline_name',
                'passport_ack_home_country',
                'passport_ack_departure_date_time',
                'passport_ack_home_country_departure_date_time',
            ]);
        });
    }
};
