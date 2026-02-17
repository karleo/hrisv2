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
        Schema::table('it_requests', function (Blueprint $table) {
            $table->foreignId('employee_id')->after('id')->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->after('employee_id')->constrained()->cascadeOnDelete();
            $table->string('status')->after('department_id')->default('submitted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
            $table->dropConstrainedForeignId('employee_id');
            $table->dropColumn('status');
        });
    }
};
