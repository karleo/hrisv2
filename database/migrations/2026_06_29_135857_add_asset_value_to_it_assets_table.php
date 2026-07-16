<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('it_assets', function (Blueprint $table): void {
            $table->decimal('asset_value', 14, 2)->nullable()->after('warranty_expires_at');
            $table->string('asset_currency', 3)->nullable()->after('asset_value');
        });
    }

    public function down(): void
    {
        Schema::table('it_assets', function (Blueprint $table): void {
            $table->dropColumn(['asset_value', 'asset_currency']);
        });
    }
};
