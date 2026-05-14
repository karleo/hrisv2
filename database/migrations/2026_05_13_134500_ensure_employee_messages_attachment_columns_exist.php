<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('employee_messages')) {
            return;
        }

        Schema::table('employee_messages', function (Blueprint $table): void {
            if (! Schema::hasColumn('employee_messages', 'attachment_path')) {
                $table->string('attachment_path')->nullable()->after('body');
            }

            if (! Schema::hasColumn('employee_messages', 'attachment_original_name')) {
                $after = Schema::hasColumn('employee_messages', 'attachment_path')
                    ? 'attachment_path'
                    : 'body';

                $table->string('attachment_original_name')->nullable()->after($after);
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('employee_messages')) {
            return;
        }

        Schema::table('employee_messages', function (Blueprint $table): void {
            if (Schema::hasColumn('employee_messages', 'attachment_original_name')) {
                $table->dropColumn('attachment_original_name');
            }

            if (Schema::hasColumn('employee_messages', 'attachment_path')) {
                $table->dropColumn('attachment_path');
            }
        });
    }
};
