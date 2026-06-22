<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_period_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_profile_id')->nullable()->constrained()->nullOnDelete();
            $table->date('period_from');
            $table->date('period_to');
            $table->string('status', 32)->default('pending_hr');

            $table->foreignId('hr_verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('hr_verified_at')->nullable();
            $table->text('hr_notes')->nullable();

            $table->foreignId('finance_verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('finance_verified_at')->nullable();
            $table->text('finance_notes')->nullable();

            $table->timestamps();

            $table->unique(['company_profile_id', 'period_from', 'period_to'], 'ppv_company_period_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_period_verifications');
    }
};
