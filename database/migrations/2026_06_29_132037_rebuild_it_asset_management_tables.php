<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('it_asset_request_activity_logs');
        Schema::dropIfExists('it_asset_request_hardware_items');
        Schema::dropIfExists('it_asset_requests');

        DB::table('role_module_permissions')
            ->where('module', 'it_asset_requests')
            ->update(['module' => 'it_assets']);

        Schema::create('accessories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('it_assets', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('category', 20);
            $table->string('name');
            $table->string('status', 20)->default('available');
            $table->foreignId('hardware_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('hardware_asset_value_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('software_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('accessory_id')->nullable()->constrained()->nullOnDelete();
            $table->string('serial_number', 100)->nullable();
            $table->string('asset_tag', 100)->nullable();
            $table->string('license_key', 255)->nullable();
            $table->unsignedSmallInteger('license_seats')->nullable();
            $table->date('expiry_date')->nullable();
            $table->date('purchase_date')->nullable();
            $table->date('warranty_expires_at')->nullable();
            $table->text('condition_notes')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('current_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['category', 'status']);
            $table->index('current_employee_id');
        });

        Schema::create('it_asset_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('it_asset_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->timestamp('assigned_at');
            $table->timestamp('returned_at')->nullable();
            $table->foreignId('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('returned_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('assignment_notes')->nullable();
            $table->text('return_notes')->nullable();
            $table->string('condition_on_return', 255)->nullable();
            $table->timestamps();

            $table->index(['it_asset_id', 'returned_at']);
            $table->index(['employee_id', 'returned_at']);
        });

        Schema::create('it_asset_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('it_asset_id')->constrained()->cascadeOnDelete();
            $table->foreignId('it_asset_assignment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event_type', 30);
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name');
            $table->json('metadata')->nullable();
            $table->timestamp('created_at');

            $table->index(['it_asset_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('it_asset_events');
        Schema::dropIfExists('it_asset_assignments');
        Schema::dropIfExists('it_assets');
        Schema::dropIfExists('accessories');

        DB::table('role_module_permissions')
            ->where('module', 'it_assets')
            ->update(['module' => 'it_asset_requests']);
    }
};
