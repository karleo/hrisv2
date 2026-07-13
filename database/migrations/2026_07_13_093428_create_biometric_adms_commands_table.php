<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biometric_adms_commands', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number', 64)->index();
            $table->string('command', 512);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biometric_adms_commands');
    }
};
