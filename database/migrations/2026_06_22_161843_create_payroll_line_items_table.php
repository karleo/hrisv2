<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_line_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_run_employee_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32); // 'earning' or 'deduction'
            $table->string('description', 255);
            $table->decimal('amount', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_line_items');
    }
};
