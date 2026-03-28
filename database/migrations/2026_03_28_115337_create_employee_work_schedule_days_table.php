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
        Schema::create('employee_work_schedule_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            /** ISO-8601: 1 = Monday … 7 = Sunday */
            $table->unsignedTinyInteger('weekday');
            $table->boolean('is_rest_day')->default(false);
            $table->time('work_starts_at')->nullable();
            $table->time('work_ends_at')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'weekday']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_work_schedule_days');
    }
};
