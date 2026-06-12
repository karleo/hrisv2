<?php

use App\Models\AppVersion;
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
        if (Schema::hasTable('app_versions')) {
            return;
        }

        Schema::create('app_versions', function (Blueprint $table): void {
            $table->id();
            $table->string('version', 20)->unique();
            $table->text('description')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();
        });

        AppVersion::query()->firstOrCreate(
            ['version' => '1.12'],
            [
                'description' => 'Initial tracked release version.',
                'released_at' => now(),
            ],
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_versions');
    }
};
