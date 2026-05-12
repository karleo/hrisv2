<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('employee_conversations')->cascadeOnDelete();
            $table->foreignId('sender_employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('recipient_employee_id')->constrained('employees')->cascadeOnDelete();
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
            $table->index(['recipient_employee_id', 'read_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_messages');
    }
};
