<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_compensations', function (Blueprint $table) {
            $table->string('overtime_rate_basis', 32)->default('per_hour')->after('overtime_rate_multiplier');
            $table->decimal('overtime_standard_monthly_hours', 6, 2)->default(176)->after('overtime_rate_basis');
        });
    }

    public function down(): void
    {
        Schema::table('employee_compensations', function (Blueprint $table) {
            $table->dropColumn(['overtime_rate_basis', 'overtime_standard_monthly_hours']);
        });
    }
};
