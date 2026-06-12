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
            $table->boolean('workflow_email_enabled')
                ->default(false)
                ->after('mail_enabled');
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
            $table->dropColumn('workflow_email_enabled');
        });
    }
};
