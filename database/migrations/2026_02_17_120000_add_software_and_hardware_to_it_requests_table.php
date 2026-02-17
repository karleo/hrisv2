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
        Schema::table('it_requests', function (Blueprint $table) {
            $table->foreignId('software_id')
                ->nullable()
                ->after('department_id')
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('hardware_id')
                ->nullable()
                ->after('software_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('hardware_id');
            $table->dropConstrainedForeignId('software_id');
        });
    }
};

