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
        Schema::table('employees', function (Blueprint $table) {
            $table->string('company_name')->nullable()->after('photo');
            $table->string('company_address_1')->nullable()->after('company_name');
            $table->string('company_address_2')->nullable()->after('company_address_1');
            $table->string('company_website')->nullable()->after('company_address_2');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'company_name',
                'company_address_1',
                'company_address_2',
                'company_website',
            ]);
        });
    }
};
