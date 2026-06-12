<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biometric_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('biometric_device_id')->constrained()->cascadeOnDelete();
            $table->foreignId('triggered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sync_type')->default('manual');
            $table->string('status')->default('running');
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('fetched_count')->default(0);
            $table->unsignedInteger('inserted_count')->default(0);
            $table->unsignedInteger('duplicate_count')->default(0);
            $table->unsignedInteger('unmapped_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->unsignedInteger('sessions_created_count')->default(0);
            $table->unsignedInteger('sessions_updated_count')->default(0);
            $table->text('error_message')->nullable();
            $table->json('error_metadata')->nullable();
            $table->timestamps();

            $table->index(['biometric_device_id', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biometric_sync_logs');
    }
};
