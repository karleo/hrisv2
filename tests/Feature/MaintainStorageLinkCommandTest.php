<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MaintainStorageLinkCommandTest extends TestCase
{
    public function test_storage_maintain_creates_local_symlink(): void
    {
        config(['filesystems.default' => 'local']);

        $link = public_path('storage');

        if (is_link($link)) {
            unlink($link);
        } elseif (file_exists($link)) {
            $this->markTestSkipped('public/storage exists and is not a symbolic link.');
        }

        $this->artisan('storage:maintain')
            ->expectsOutputToContain('Running storage maintenance (local disk)')
            ->expectsOutputToContain('Created symbolic link')
            ->assertSuccessful();

        $this->assertTrue(is_link($link));
        $this->assertSame(storage_path('app/public'), readlink($link));
    }

    public function test_storage_maintain_reports_existing_local_symlink(): void
    {
        config(['filesystems.default' => 'local']);

        $this->artisan('storage:link')->assertSuccessful();

        $this->artisan('storage:maintain')
            ->expectsOutputToContain('Symbolic link already exists')
            ->assertSuccessful();
    }

    public function test_storage_maintain_verifies_s3_when_default_disk_is_s3(): void
    {
        Storage::fake('s3');

        config([
            'filesystems.default' => 's3',
            'filesystems.disks.s3.key' => 'test-key',
            'filesystems.disks.s3.secret' => 'test-secret',
            'filesystems.disks.s3.region' => 'us-east-1',
            'filesystems.disks.s3.bucket' => 'test-bucket',
            'filesystems.disks.s3.url' => 'https://test-bucket.s3.amazonaws.com',
        ]);

        $this->artisan('storage:maintain')
            ->expectsOutputToContain('Running storage maintenance (AWS S3 object storage)')
            ->expectsOutputToContain('Object storage mode (S3)')
            ->expectsOutputToContain('S3 bucket connection verified')
            ->expectsOutputToContain('Public URL base: https://test-bucket.s3.amazonaws.com')
            ->assertSuccessful();
    }

    public function test_storage_maintain_fails_when_s3_configuration_is_missing(): void
    {
        config([
            'filesystems.default' => 's3',
            'filesystems.disks.s3.key' => '',
            'filesystems.disks.s3.secret' => '',
            'filesystems.disks.s3.region' => '',
            'filesystems.disks.s3.bucket' => '',
        ]);

        $this->artisan('storage:maintain')
            ->expectsOutputToContain('Missing environment variable [AWS_ACCESS_KEY_ID]')
            ->assertFailed();
    }
}
