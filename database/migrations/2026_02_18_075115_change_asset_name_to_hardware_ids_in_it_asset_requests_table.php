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
            $table->dropColumn('asset_name');
            $table->json('hardware_ids')->nullable()->after('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_asset_requests', function (Blueprint $table) {
            $table->dropColumn('hardware_ids');
            $table->string('asset_name', 100)->nullable()->after('date');
        });
    }
};
