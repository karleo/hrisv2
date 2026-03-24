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
        Schema::table('it_requests', function (Blueprint $table): void {
            $table->string('employee_signature')->nullable()->after('date');
            $table->string('approved_by_signature')->nullable()->after('employee_signature');
            $table->foreignId('approved_by_employee_id')
                ->nullable()
                ->after('approved_by_signature')
                ->constrained('employees')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_requests', function (Blueprint $table): void {
            $table->dropForeign(['approved_by_employee_id']);
            $table->dropColumn(['employee_signature', 'approved_by_signature', 'approved_by_employee_id']);
        });
    }
};
