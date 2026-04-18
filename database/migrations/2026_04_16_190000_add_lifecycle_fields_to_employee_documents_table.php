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
        Schema::table('employee_documents', function (Blueprint $table): void {
            if (! Schema::hasColumn('employee_documents', 'status')) {
                $table->string('status', 20)->default('active')->after('expiry_date');
            }
            if (! Schema::hasColumn('employee_documents', 'version_number')) {
                $table->unsignedInteger('version_number')->default(1)->after('status');
            }
            if (! Schema::hasColumn('employee_documents', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('version_number');
            }
            if (! Schema::hasColumn('employee_documents', 'replaces_document_id')) {
                $table->unsignedBigInteger('replaces_document_id')->nullable()->after('archived_at');
            }
        });

        Schema::table('employee_documents', function (Blueprint $table): void {
            $indexes = collect(Schema::getIndexes('employee_documents'))->pluck('name')->all();

            if (! in_array('employee_documents_emp_name_status_idx', $indexes, true)) {
                $table->index(['employee_id', 'name', 'status'], 'employee_documents_emp_name_status_idx');
            }

            if (! in_array('employee_documents_replaces_doc_fk', collect(Schema::getForeignKeys('employee_documents'))->pluck('name')->all(), true)) {
                $table->foreign('replaces_document_id', 'employee_documents_replaces_doc_fk')
                    ->references('id')
                    ->on('employee_documents')
                    ->nullOnDelete();
            }
        });

        DB::table('employee_documents')
            ->whereNull('status')
            ->update([
                'status' => 'active',
                'version_number' => 1,
            ]);

        $documents = DB::table('employee_documents')
            ->select(['id', 'employee_id', 'name', 'created_at'])
            ->orderBy('employee_id')
            ->orderBy('name')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->groupBy(fn ($row): string => $row->employee_id.'|'.$row->name);

        foreach ($documents as $group) {
            $version = 0;

            foreach ($group as $row) {
                $version++;

                DB::table('employee_documents')
                    ->where('id', $row->id)
                    ->update([
                        'version_number' => $version,
                    ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_documents', function (Blueprint $table): void {
            $foreignKeys = collect(Schema::getForeignKeys('employee_documents'))->pluck('name')->all();
            if (in_array('employee_documents_replaces_doc_fk', $foreignKeys, true)) {
                $table->dropForeign('employee_documents_replaces_doc_fk');
            }

            $indexes = collect(Schema::getIndexes('employee_documents'))->pluck('name')->all();
            if (in_array('employee_documents_emp_name_status_idx', $indexes, true)) {
                $table->dropIndex('employee_documents_emp_name_status_idx');
            }

            if (Schema::hasColumn('employee_documents', 'replaces_document_id')) {
                $table->dropColumn('replaces_document_id');
            }
            if (Schema::hasColumn('employee_documents', 'archived_at')) {
                $table->dropColumn('archived_at');
            }
            if (Schema::hasColumn('employee_documents', 'version_number')) {
                $table->dropColumn('version_number');
            }
            if (Schema::hasColumn('employee_documents', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
