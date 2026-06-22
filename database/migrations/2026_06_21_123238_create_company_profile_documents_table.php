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
        Schema::create('company_profile_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('document_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('path');
            $table->string('original_name');
            $table->date('expiry_date')->nullable();
            $table->string('status', 20)->default('active');
            $table->unsignedInteger('version_number')->default(1);
            $table->timestamp('archived_at')->nullable();
            $table->unsignedBigInteger('replaces_document_id')->nullable();
            $table->timestamps();

            $table->index(['company_profile_id', 'document_type_id', 'status'], 'company_profile_docs_profile_type_status_idx');
            $table->foreign('replaces_document_id', 'company_profile_docs_replaces_doc_fk')
                ->references('id')
                ->on('company_profile_documents')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_profile_documents');
    }
};
