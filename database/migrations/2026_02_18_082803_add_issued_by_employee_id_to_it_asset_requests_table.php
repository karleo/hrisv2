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
            $table->foreignId('issued_by_employee_id')
                ->nullable()
                ->after('issued_by_signature')
                ->constrained('employees')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_asset_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('issued_by_employee_id');
        });
    }
};
