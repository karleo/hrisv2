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
        if (Schema::hasTable('employee_document_expiry_notification_logs')) {
            return;
        }

        Schema::create('employee_document_expiry_notification_logs', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('employee_document_id');
            $table->unsignedBigInteger('user_id');
            $table->date('notified_on');
            $table->timestamps();

            $table->foreign('employee_document_id', 'emp_doc_exp_notif_doc_fk')
                ->references('id')
                ->on('employee_documents')
                ->cascadeOnDelete();
            $table->foreign('user_id', 'emp_doc_exp_notif_user_fk')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
            $table->unique(['employee_document_id', 'user_id', 'notified_on'], 'employee_document_expiry_notification_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_document_expiry_notification_logs');
    }
};
