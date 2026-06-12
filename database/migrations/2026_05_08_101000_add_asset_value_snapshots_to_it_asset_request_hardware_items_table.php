<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('it_asset_request_hardware_items', function (Blueprint $table): void {
            $table->decimal('asset_value_snapshot', 14, 2)->nullable()->after('serial_number_snapshot');
            $table->string('asset_currency_snapshot', 3)->nullable()->after('asset_value_snapshot');

            $table->index('hardware_id', 'it_asset_request_hardware_items_hardware_id_index');
            $table->index('asset_currency_snapshot', 'it_asset_request_hardware_items_currency_snapshot_index');
        });
    }

    public function down(): void
    {
        Schema::table('it_asset_request_hardware_items', function (Blueprint $table): void {
            $table->dropIndex('it_asset_request_hardware_items_currency_snapshot_index');
            $table->dropIndex('it_asset_request_hardware_items_hardware_id_index');
            $table->dropColumn(['asset_value_snapshot', 'asset_currency_snapshot']);
        });
    }
};
