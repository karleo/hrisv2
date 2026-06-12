<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_one_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('employee_two_id')->constrained('employees')->cascadeOnDelete();
            $table->unsignedBigInteger('last_message_id')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->unique(['employee_one_id', 'employee_two_id'], 'employee_conversations_pair_unique');
            $table->index('last_message_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_conversations');
    }
};
