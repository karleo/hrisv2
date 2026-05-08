<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('hardware', function (Blueprint $table): void {
            if (! Schema::hasColumn('hardware', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('it_asset_request_hardware_items', function (Blueprint $table): void {
            if (! Schema::hasColumn('it_asset_request_hardware_items', 'hardware_code_snapshot')) {
                $table->string('hardware_code_snapshot', 50)->nullable()->after('hardware_id');
            }

            if (! Schema::hasColumn('it_asset_request_hardware_items', 'hardware_name_snapshot')) {
                $table->string('hardware_name_snapshot')->nullable()->after('hardware_code_snapshot');
            }

            if (! Schema::hasColumn('it_asset_request_hardware_items', 'serial_number_snapshot')) {
                $table->string('serial_number_snapshot', 100)->nullable()->after('serial_number');
            }
        });

        DB::table('it_asset_request_hardware_items')
            ->select([
                'it_asset_request_hardware_items.id',
                'it_asset_request_hardware_items.serial_number',
                'it_asset_request_hardware_items.hardware_code_snapshot',
                'it_asset_request_hardware_items.hardware_name_snapshot',
                'it_asset_request_hardware_items.serial_number_snapshot',
                'hardware.code as hardware_code',
                'hardware.name as hardware_name',
            ])
            ->join('hardware', 'hardware.id', '=', 'it_asset_request_hardware_items.hardware_id')
            ->where(function ($query): void {
                $query->whereNull('it_asset_request_hardware_items.hardware_code_snapshot')
                    ->orWhereNull('it_asset_request_hardware_items.hardware_name_snapshot')
                    ->orWhereNull('it_asset_request_hardware_items.serial_number_snapshot');
            })
            ->orderBy('it_asset_request_hardware_items.id')
            ->get()
            ->each(function ($item): void {
                $updates = [];
                if ($item->hardware_code_snapshot === null) {
                    $updates['hardware_code_snapshot'] = $item->hardware_code;
                }

                if ($item->hardware_name_snapshot === null) {
                    $updates['hardware_name_snapshot'] = $item->hardware_name;
                }

                if ($item->serial_number_snapshot === null) {
                    $updates['serial_number_snapshot'] = $item->serial_number;
                }

                if ($updates === []) {
                    return;
                }

                DB::table('it_asset_request_hardware_items')
                    ->where('id', $item->id)
                    ->update($updates);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_asset_request_hardware_items', function (Blueprint $table): void {
            if (Schema::hasColumn('it_asset_request_hardware_items', 'hardware_code_snapshot')) {
                $table->dropColumn('hardware_code_snapshot');
            }

            if (Schema::hasColumn('it_asset_request_hardware_items', 'hardware_name_snapshot')) {
                $table->dropColumn('hardware_name_snapshot');
            }

            if (Schema::hasColumn('it_asset_request_hardware_items', 'serial_number_snapshot')) {
                $table->dropColumn('serial_number_snapshot');
            }
        });

        Schema::table('hardware', function (Blueprint $table): void {
            if (Schema::hasColumn('hardware', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
