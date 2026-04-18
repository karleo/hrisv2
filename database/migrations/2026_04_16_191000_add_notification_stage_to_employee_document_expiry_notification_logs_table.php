<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('employee_document_expiry_notification_logs')) {
            return;
        }

        Schema::table('employee_document_expiry_notification_logs', function (Blueprint $table): void {
            if (! Schema::hasColumn('employee_document_expiry_notification_logs', 'notification_stage')) {
                $table->string('notification_stage', 30)->default('reminder_daily')->after('notified_on');
            }
        });

        DB::table('employee_document_expiry_notification_logs')
            ->whereNull('notification_stage')
            ->update(['notification_stage' => 'reminder_daily']);

        Schema::table('employee_document_expiry_notification_logs', function (Blueprint $table): void {
            $indexes = collect(Schema::getIndexes('employee_document_expiry_notification_logs'))->pluck('name')->all();
            if (in_array('employee_document_expiry_notification_unique', $indexes, true)) {
                $table->dropUnique('employee_document_expiry_notification_unique');
            }

            if (! in_array('employee_doc_expiry_notification_stage_unique', collect(Schema::getIndexes('employee_document_expiry_notification_logs'))->pluck('name')->all(), true)) {
                $table->unique(
                    ['employee_document_id', 'user_id', 'notified_on', 'notification_stage'],
                    'employee_doc_expiry_notification_stage_unique'
                );
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('employee_document_expiry_notification_logs')) {
            return;
        }

        Schema::table('employee_document_expiry_notification_logs', function (Blueprint $table): void {
            $indexes = collect(Schema::getIndexes('employee_document_expiry_notification_logs'))->pluck('name')->all();
            if (in_array('employee_doc_expiry_notification_stage_unique', $indexes, true)) {
                $table->dropUnique('employee_doc_expiry_notification_stage_unique');
            }
            if (! in_array('employee_document_expiry_notification_unique', collect(Schema::getIndexes('employee_document_expiry_notification_logs'))->pluck('name')->all(), true)) {
                $table->unique(
                    ['employee_document_id', 'user_id', 'notified_on'],
                    'employee_document_expiry_notification_unique'
                );
            }

            if (Schema::hasColumn('employee_document_expiry_notification_logs', 'notification_stage')) {
                $table->dropColumn('notification_stage');
            }
        });
    }
};
