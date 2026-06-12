<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('it_asset_request_hardware_items', function (Blueprint $table): void {
            $table->dropForeign(['it_asset_request_id']);
            $table->dropForeign(['hardware_id']);
        });

        Schema::table('it_asset_request_hardware_items', function (Blueprint $table): void {
            $table->dropUnique('it_asset_request_hardware_unique');
            $table->foreign('it_asset_request_id')
                ->references('id')
                ->on('it_asset_requests')
                ->cascadeOnDelete();
            $table->foreign('hardware_id')
                ->references('id')
                ->on('hardware')
                ->restrictOnDelete();

            $table->foreignId('hardware_asset_value_id')
                ->nullable()
                ->after('it_asset_request_id')
                ->constrained('hardware_asset_values')
                ->nullOnDelete();
            $table->string('asset_model_snapshot')->nullable()->after('hardware_name_snapshot');

            $table->index('hardware_asset_value_id', 'it_asset_request_hardware_items_asset_value_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('it_asset_request_hardware_items', function (Blueprint $table): void {
            $table->dropForeign(['hardware_asset_value_id']);
            $table->dropForeign(['it_asset_request_id']);
            $table->dropForeign(['hardware_id']);
        });

        Schema::table('it_asset_request_hardware_items', function (Blueprint $table): void {
            $table->dropIndex('it_asset_request_hardware_items_asset_value_id_index');
            $table->dropColumn(['hardware_asset_value_id', 'asset_model_snapshot']);
            $table->unique(['it_asset_request_id', 'hardware_id'], 'it_asset_request_hardware_unique');
            $table->foreign('it_asset_request_id')
                ->references('id')
                ->on('it_asset_requests')
                ->cascadeOnDelete();
            $table->foreign('hardware_id')
                ->references('id')
                ->on('hardware')
                ->restrictOnDelete();
        });
    }
};
