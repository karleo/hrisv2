<?php

use App\Models\DocumentType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('employee_documents') || ! Schema::hasTable('document_types')) {
            return;
        }

        Schema::table('employee_documents', function (Blueprint $table): void {
            if (! Schema::hasColumn('employee_documents', 'document_type_id')) {
                $table->unsignedBigInteger('document_type_id')->nullable()->after('employee_id');
            }
        });

        $existingNames = DB::table('employee_documents')
            ->whereNotNull('name')
            ->distinct()
            ->pluck('name')
            ->filter(fn ($name) => is_string($name) && trim($name) !== '')
            ->values();

        foreach ($existingNames as $name) {
            $trimmedName = trim((string) $name);
            $baseCode = Str::upper(Str::limit(Str::slug($trimmedName, '_'), 45, ''));
            $code = $baseCode !== '' ? $baseCode : 'DOCUMENT_TYPE';
            $suffix = 1;

            while (DocumentType::query()->where('code', $code)->exists()) {
                $suffix++;
                $code = Str::limit($baseCode !== '' ? $baseCode : 'DOCUMENT_TYPE', 45, '').'_'.$suffix;
            }

            DocumentType::query()->firstOrCreate(
                ['name' => $trimmedName],
                [
                    'code' => $code,
                    'description' => null,
                    'requires_expiry_date' => false,
                    'is_active' => true,
                ]
            );
        }

        $typeIdByName = DocumentType::query()->pluck('id', 'name');

        DB::table('employee_documents')
            ->select(['id', 'name'])
            ->orderBy('id')
            ->chunkById(200, function ($documents) use ($typeIdByName): void {
                foreach ($documents as $document) {
                    $typeId = $typeIdByName[$document->name] ?? null;
                    if ($typeId === null) {
                        continue;
                    }

                    DB::table('employee_documents')
                        ->where('id', $document->id)
                        ->update(['document_type_id' => $typeId]);
                }
            });

        Schema::table('employee_documents', function (Blueprint $table): void {
            $foreignKeys = collect(Schema::getForeignKeys('employee_documents'))->pluck('name')->all();
            if (! in_array('employee_documents_document_type_fk', $foreignKeys, true)) {
                $table->foreign('document_type_id', 'employee_documents_document_type_fk')
                    ->references('id')
                    ->on('document_types')
                    ->restrictOnDelete();
            }

            $indexes = collect(Schema::getIndexes('employee_documents'))->pluck('name')->all();
            if (! in_array('employee_documents_document_type_idx', $indexes, true)) {
                $table->index('document_type_id', 'employee_documents_document_type_idx');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('employee_documents')) {
            return;
        }

        Schema::table('employee_documents', function (Blueprint $table): void {
            $foreignKeys = collect(Schema::getForeignKeys('employee_documents'))->pluck('name')->all();
            if (in_array('employee_documents_document_type_fk', $foreignKeys, true)) {
                $table->dropForeign('employee_documents_document_type_fk');
            }

            $indexes = collect(Schema::getIndexes('employee_documents'))->pluck('name')->all();
            if (in_array('employee_documents_document_type_idx', $indexes, true)) {
                $table->dropIndex('employee_documents_document_type_idx');
            }

            if (Schema::hasColumn('employee_documents', 'document_type_id')) {
                $table->dropColumn('document_type_id');
            }
        });
    }
};
