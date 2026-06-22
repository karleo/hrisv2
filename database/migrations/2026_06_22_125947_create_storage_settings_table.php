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
        Schema::create('storage_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('driver')->default('local');
            $table->string('aws_access_key_id')->nullable();
            $table->text('aws_secret_access_key')->nullable();
            $table->string('aws_default_region')->nullable();
            $table->string('aws_bucket')->nullable();
            $table->string('aws_url')->nullable();
            $table->boolean('aws_use_path_style_endpoint')->default(false);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('storage_settings');
    }
};
