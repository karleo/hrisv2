<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biometric_devices', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('model')->default('iClock990');
            $table->string('serial_number')->unique();
            $table->string('connection_type')->default('tcp_pull');
            $table->string('host')->nullable();
            $table->unsignedSmallInteger('port')->default(4370);
            $table->text('comm_key')->nullable();
            $table->string('timezone')->default('UTC');
            $table->boolean('is_active')->default(false);
            $table->timestamp('last_sync_at')->nullable();
            $table->string('last_sync_status')->nullable();
            $table->text('last_error')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biometric_devices');
    }
};
