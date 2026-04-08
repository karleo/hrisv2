<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table): void {
            $table->string('profile_address_1')->nullable()->after('address_2');
            $table->string('profile_address_2')->nullable()->after('profile_address_1');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table): void {
            $table->dropColumn([
                'profile_address_1',
                'profile_address_2',
            ]);
        });
    }
};

