<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_compensations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();

            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->string('currency', 8)->default('AED');
            $table->string('pay_frequency', 32)->default('monthly');

            // Allowances
            $table->decimal('housing_allowance', 12, 2)->default(0);
            $table->decimal('transport_allowance', 12, 2)->default(0);
            $table->decimal('food_allowance', 12, 2)->default(0);
            $table->decimal('other_allowance', 12, 2)->default(0);

            // Deductions
            $table->decimal('loan_deduction', 12, 2)->default(0);
            $table->decimal('other_deduction', 12, 2)->default(0);

            // Overtime settings
            $table->decimal('overtime_rate_multiplier', 5, 2)->default(1.25);

            // Bank / payment details
            $table->string('bank_name', 255)->nullable();
            $table->string('bank_account_number', 64)->nullable();
            $table->string('iban', 34)->nullable();

            // History / effective date
            $table->date('effective_from')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_compensations');
    }
};
