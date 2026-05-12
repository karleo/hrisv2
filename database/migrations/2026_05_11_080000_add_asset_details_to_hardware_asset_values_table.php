<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hardware_asset_values', function (Blueprint $table): void {
            $table->string('asset_model')->nullable()->after('hardware_id');
            $table->date('purchase_date')->nullable()->after('asset_currency');
            $table->string('vendor')->nullable()->after('purchase_date');
            $table->string('serial_number')->nullable()->after('vendor');
            $table->text('specs')->nullable()->after('serial_number');
            $table->date('effective_from')->nullable()->change();

            $table->index('asset_model');
            $table->index('vendor');
            $table->index('serial_number');
        });
    }

    public function down(): void
    {
        Schema::table('hardware_asset_values', function (Blueprint $table): void {
            $table->dropIndex(['asset_model']);
            $table->dropIndex(['vendor']);
            $table->dropIndex(['serial_number']);
            $table->dropColumn(['asset_model', 'purchase_date', 'vendor', 'serial_number', 'specs']);
            $table->date('effective_from')->nullable(false)->change();
        });
    }
};
