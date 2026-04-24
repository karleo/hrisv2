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
            $table->string('transport_mode')->default('smtp')->after('workflow_email_enabled');
            $table->string('graph_tenant_id')->nullable()->after('transport_mode');
            $table->string('graph_client_id')->nullable()->after('graph_tenant_id');
            $table->text('graph_client_secret')->nullable()->after('graph_client_id');
            $table->string('graph_sender')->nullable()->after('graph_client_secret');
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
                'transport_mode',
                'graph_tenant_id',
                'graph_client_id',
                'graph_client_secret',
                'graph_sender',
            ]);
        });
    }
};
