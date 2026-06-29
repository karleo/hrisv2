<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('it_asset_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('it_asset_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('original_name');
            $table->foreignId('uploaded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('it_asset_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('it_asset_documents');
    }
};
