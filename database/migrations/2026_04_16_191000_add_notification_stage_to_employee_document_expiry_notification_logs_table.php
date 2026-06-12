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

        $indexes = collect(Schema::getIndexes('employee_document_expiry_notification_logs'))->pluck('name')->all();

        if (in_array('employee_document_expiry_notification_unique', $indexes, true)) {
            try {
                Schema::table('employee_document_expiry_notification_logs', function (Blueprint $table): void {
                    $table->dropUnique('employee_document_expiry_notification_unique');
                });
            } catch (\Throwable) {
                // Some environments may have an FK dependency on this index; keep migration non-blocking.
            }
        }

        $indexes = collect(Schema::getIndexes('employee_document_expiry_notification_logs'))->pluck('name')->all();
        if (! in_array('employee_doc_expiry_notification_stage_unique', $indexes, true)) {
            try {
                Schema::table('employee_document_expiry_notification_logs', function (Blueprint $table): void {
                    $table->unique(
                        ['employee_document_id', 'user_id', 'notified_on', 'notification_stage'],
                        'employee_doc_expiry_notification_stage_unique'
                    );
                });
            } catch (\Throwable) {
                // Keep migration resilient when legacy indexes/constraints already enforce uniqueness.
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('employee_document_expiry_notification_logs')) {
            return;
        }

        $indexes = collect(Schema::getIndexes('employee_document_expiry_notification_logs'))->pluck('name')->all();
        if (in_array('employee_doc_expiry_notification_stage_unique', $indexes, true)) {
            try {
                Schema::table('employee_document_expiry_notification_logs', function (Blueprint $table): void {
                    $table->dropUnique('employee_doc_expiry_notification_stage_unique');
                });
            } catch (\Throwable) {
                // Ignore if dependent constraints prevent dropping in this environment.
            }
        }

        $indexes = collect(Schema::getIndexes('employee_document_expiry_notification_logs'))->pluck('name')->all();
        if (! in_array('employee_document_expiry_notification_unique', $indexes, true)) {
            try {
                Schema::table('employee_document_expiry_notification_logs', function (Blueprint $table): void {
                    $table->unique(
                        ['employee_document_id', 'user_id', 'notified_on'],
                        'employee_document_expiry_notification_unique'
                    );
                });
            } catch (\Throwable) {
                // Ignore if an equivalent index/constraint already exists.
            }
        }

        if (Schema::hasColumn('employee_document_expiry_notification_logs', 'notification_stage')) {
            Schema::table('employee_document_expiry_notification_logs', function (Blueprint $table): void {
                $table->dropColumn('notification_stage');
            });
        }
    }
};
