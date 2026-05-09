<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hardware_asset_values', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hardware_id')
                ->constrained('hardware')
                ->restrictOnDelete();
            $table->decimal('asset_value', 14, 2)->nullable();
            $table->string('asset_currency', 3)->nullable();
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('hardware_id');
            $table->index('asset_currency');
            $table->index(['hardware_id', 'is_active', 'effective_from'], 'hardware_asset_values_lookup_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hardware_asset_values');
    }
};
