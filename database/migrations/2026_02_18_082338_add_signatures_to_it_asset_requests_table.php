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
        Schema::table('it_asset_requests', function (Blueprint $table) {
            $table->string('employee_signature')->nullable()->after('remarks');
            $table->string('issued_by_signature')->nullable()->after('employee_signature');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_asset_requests', function (Blueprint $table) {
            $table->dropColumn(['employee_signature', 'issued_by_signature']);
        });
    }
};
