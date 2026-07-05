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
        if (! Schema::hasTable('mail_settings')) {
            return;
        }

        Schema::table('mail_settings', function (Blueprint $table): void {
            $table->boolean('document_expiry_email_enabled')
                ->default(false)
                ->after('workflow_email_enabled');
            $table->unsignedSmallInteger('document_expiry_notify_days')
                ->default(30)
                ->after('document_expiry_email_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('mail_settings')) {
            return;
        }

        Schema::table('mail_settings', function (Blueprint $table): void {
            $table->dropColumn([
                'document_expiry_email_enabled',
                'document_expiry_notify_days',
            ]);
        });
    }
};
