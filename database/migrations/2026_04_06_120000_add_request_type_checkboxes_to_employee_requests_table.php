<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_requests', function (Blueprint $table): void {
            $table->boolean('ticket_booking')->default(false);
            $table->boolean('passport_request')->default(false);
            $table->boolean('ticket_encashment')->default(false);
            $table->boolean('amount_2000')->default(false);
            $table->boolean('amount_1000')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('employee_requests', function (Blueprint $table): void {
            $table->dropColumn([
                'ticket_booking',
                'passport_request',
                'ticket_encashment',
                'amount_2000',
                'amount_1000',
            ]);
        });
    }
};
