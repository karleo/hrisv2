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
        Schema::table('employee_requests', function (Blueprint $table) {
            $table->date('departure_date')->nullable()->after('date_of_joining');
            $table->date('arrival_date')->nullable()->after('departure_date');
            $table->string('preferred_airlines', 100)->nullable()->after('arrival_date');
            $table->date('last_encashment_date')->nullable()->after('preferred_airlines');
            $table->string('bag_allowance', 50)->nullable()->after('last_encashment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_requests', function (Blueprint $table) {
            $table->dropColumn([
                'departure_date',
                'arrival_date',
                'preferred_airlines',
                'last_encashment_date',
                'bag_allowance',
            ]);
        });
    }
};

