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
            if (Schema::hasColumn('it_asset_requests', 'asset_name')) {
                $table->dropColumn('asset_name');
            }

            if (! Schema::hasColumn('it_asset_requests', 'hardware_ids')) {
                $table->json('hardware_ids')->nullable()->after('date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_asset_requests', function (Blueprint $table) {
            if (Schema::hasColumn('it_asset_requests', 'hardware_ids')) {
                $table->dropColumn('hardware_ids');
            }

            if (! Schema::hasColumn('it_asset_requests', 'asset_name')) {
                $table->string('asset_name', 100)->nullable()->after('date');
            }
        });
    }
};
