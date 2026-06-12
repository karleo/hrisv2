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
        Schema::table('company_profiles', function (Blueprint $table): void {
            $table->string('business_card_back_logo_1')->nullable()->after('business_card_logo');
            $table->string('business_card_back_logo_2')->nullable()->after('business_card_back_logo_1');
            $table->string('business_card_back_logo_3')->nullable()->after('business_card_back_logo_2');
            $table->string('business_card_back_logo_4')->nullable()->after('business_card_back_logo_3');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_profiles', function (Blueprint $table): void {
            $table->dropColumn([
                'business_card_back_logo_1',
                'business_card_back_logo_2',
                'business_card_back_logo_3',
                'business_card_back_logo_4',
            ]);
        });
    }
};
