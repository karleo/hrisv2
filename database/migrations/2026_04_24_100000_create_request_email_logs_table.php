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
        Schema::create('request_email_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('request_type', 40);
            $table->unsignedBigInteger('request_id');
            $table->string('notification_type', 40);
            $table->string('recipient_email');
            $table->string('channel', 20)->default('mail');
            $table->string('status', 20);
            $table->string('reason', 50)->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('performed_at')->useCurrent();
            $table->timestamps();

            $table->index(['request_type', 'request_id', 'performed_at'], 'req_email_logs_req_idx');
            $table->index(['status', 'performed_at'], 'req_email_logs_status_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_email_logs');
    }
};
