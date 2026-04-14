<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_types', function (Blueprint $table): void {
            $table->string('leave_category', 20)
                ->default('paid')
                ->after('name');
        });

        DB::table('leave_types')
            ->where('name', 'Unpaid Leave')
            ->update(['leave_category' => 'unpaid']);
    }

    public function down(): void
    {
        Schema::table('leave_types', function (Blueprint $table): void {
            $table->dropColumn('leave_category');
        });
    }
};

