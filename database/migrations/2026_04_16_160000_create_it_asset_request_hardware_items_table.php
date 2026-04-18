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
        Schema::create('it_asset_request_hardware_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('it_asset_request_id')
                ->constrained('it_asset_requests')
                ->cascadeOnDelete();
            $table->foreignId('hardware_id')
                ->constrained('hardware')
                ->restrictOnDelete();
            $table->string('serial_number', 100)->nullable();
            $table->timestamps();

            $table->unique(['it_asset_request_id', 'hardware_id'], 'it_asset_request_hardware_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('it_asset_request_hardware_items');
    }
};
