<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_compensation_items', function (Blueprint $table) {
            $table->foreignId('pay_allowance_type_id')
                ->nullable()
                ->after('type')
                ->constrained('pay_allowance_types')
                ->nullOnDelete();
            $table->foreignId('pay_deduction_type_id')
                ->nullable()
                ->after('pay_allowance_type_id')
                ->constrained('pay_deduction_types')
                ->nullOnDelete();
            $table->decimal('principal_amount', 12, 2)->nullable()->after('amount');
            $table->decimal('remaining_balance', 12, 2)->nullable()->after('principal_amount');
        });
    }

    public function down(): void
    {
        Schema::table('employee_compensation_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pay_allowance_type_id');
            $table->dropConstrainedForeignId('pay_deduction_type_id');
            $table->dropColumn(['principal_amount', 'remaining_balance']);
        });
    }
};
