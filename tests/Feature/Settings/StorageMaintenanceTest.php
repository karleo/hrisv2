<?php

namespace Tests\Feature\Settings;

use App\Models\Role;
use App\Models\StorageSetting;
use App\Models\User;
use App\Services\Database\DatabaseBackupService;
use App\Services\Storage\StorageSettingsManager;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StorageMaintenanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_storage_maintenance_page_requires_administrator(): void
    {
        $basicRoleId = Role::query()->where('slug', 'basic')->value('id');
        $user = User::factory()->create([
            'role_id' => $basicRoleId,
        ]);

        $this->actingAs($user)
            ->get(route('storage-maintenance.edit'))
            ->assertForbidden();
    }

    public function test_administrator_can_view_storage_maintenance_page(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->get(route('storage-maintenance.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/storage-maintenance')
                ->has('settings.driver')
                ->has('status.mode')
                ->has('database.driver')
                ->has('status.instructions'));
    }

    public function test_administrator_can_save_s3_storage_settings(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->put(route('storage-maintenance.update'), [
                'driver' => 's3',
                'aws_access_key_id' => 'test-key',
                'aws_secret_access_key' => 'test-secret',
                'aws_default_region' => 'us-east-1',
                'aws_bucket' => 'test-bucket',
                'aws_url' => 'https://test-bucket.s3.amazonaws.com',
                'aws_use_path_style_endpoint' => false,
            ])
            ->assertRedirect(route('storage-maintenance.edit'));

        $setting = StorageSetting::query()->firstOrFail();
        $this->assertSame('s3', $setting->driver);
        $this->assertSame('test-bucket', $setting->aws_bucket);
        $this->assertSame('test-secret', $setting->aws_secret_access_key);

        $resolved = app(StorageSettingsManager::class)->applyLatest();
        $this->assertSame('s3', $resolved['driver']);
        $this->assertSame('test-bucket', config('filesystems.disks.s3.bucket'));
        $this->assertSame('s3', config('filesystems.disks.public.driver'));
    }

    public function test_administrator_can_run_local_storage_maintenance_from_ui(): void
    {
        config(['filesystems.default' => 'local']);

        $admin = User::factory()->create();
        $link = public_path('storage');

        if (is_link($link)) {
            unlink($link);
        } elseif (file_exists($link)) {
            $this->markTestSkipped('public/storage exists and is not a symbolic link.');
        }

        $this->actingAs($admin)
            ->post(route('storage-maintenance.run'))
            ->assertRedirect(route('storage-maintenance.edit'))
            ->assertSessionHas('maintenance_result.success', true);

        $this->assertTrue(is_link($link));
    }

    public function test_administrator_can_run_s3_storage_maintenance_from_ui(): void
    {
        Storage::fake('s3');

        StorageSetting::singletonOrCreate(['driver' => 'local'])->update([
            'driver' => 's3',
            'aws_access_key_id' => 'test-key',
            'aws_secret_access_key' => 'test-secret',
            'aws_default_region' => 'us-east-1',
            'aws_bucket' => 'test-bucket',
        ]);

        app(StorageSettingsManager::class)->forgetCache();
        app(StorageSettingsManager::class)->applyLatest();

        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->post(route('storage-maintenance.run'))
            ->assertRedirect(route('storage-maintenance.edit'))
            ->assertSessionHas('maintenance_result.success', true);
    }

    public function test_administrator_can_create_database_backup(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->post(route('storage-maintenance.database.backup'))
            ->assertRedirect(route('storage-maintenance.edit'))
            ->assertSessionHas('database_result.success', true);

        $backups = app(DatabaseBackupService::class)->listBackups();
        $this->assertNotEmpty($backups);

        $this->actingAs($admin)
            ->get(route('storage-maintenance.database.download', ['filename' => $backups[0]['name']]))
            ->assertOk();

        File::deleteDirectory(storage_path('app/backups/database'));
    }

    public function test_administrator_can_restore_stored_database_backup(): void
    {
        $admin = User::factory()->create();
        $service = app(DatabaseBackupService::class);
        $filename = $service->backup();

        $this->actingAs($admin)
            ->post(route('storage-maintenance.database.restore-stored'), [
                'backup_name' => $filename,
                'confirm_restore' => '1',
            ])
            ->assertRedirect(route('storage-maintenance.edit'))
            ->assertSessionHas('database_result.success', true);

        File::deleteDirectory(storage_path('app/backups/database'));
    }
}
