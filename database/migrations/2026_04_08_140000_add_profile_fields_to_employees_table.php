<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table): void {
            $table->string('phone', 50)->nullable()->after('contact_number');
            $table->string('mobile', 50)->nullable()->after('phone');
            $table->date('date_of_birth')->nullable()->after('mobile');
            $table->string('gender', 20)->nullable()->after('date_of_birth');
            $table->string('marital_status', 20)->nullable()->after('gender');
            $table->string('emergency_contact_name', 255)->nullable()->after('marital_status');
            $table->string('emergency_contact_phone', 50)->nullable()->after('emergency_contact_name');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table): void {
            $table->dropColumn([
                'phone',
                'mobile',
                'date_of_birth',
                'gender',
                'marital_status',
                'emergency_contact_name',
                'emergency_contact_phone',
            ]);
        });
    }
};

