<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'face_enrolled_at')) {
                $table->timestamp('face_enrolled_at')->nullable();
            }
            if (! Schema::hasColumn('users', 'face_reference_path')) {
                $table->string('face_reference_path', 512)->nullable();
            }
            if (! Schema::hasColumn('users', 'face_provider')) {
                $table->string('face_provider', 32)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = ['face_enrolled_at', 'face_reference_path', 'face_provider'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
