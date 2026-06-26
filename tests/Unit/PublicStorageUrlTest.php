<?php

namespace Tests\Unit;

use App\Support\PublicStorageUrl;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicStorageUrlTest extends TestCase
{
    public function test_for_path_returns_null_for_blank_values(): void
    {
        $this->assertNull(PublicStorageUrl::forPath(null));
        $this->assertNull(PublicStorageUrl::forPath(''));
    }

    public function test_for_path_returns_relative_url_on_local_disk(): void
    {
        config([
            'filesystems.disks.public.driver' => 'local',
        ]);

        $this->assertSame(
            '/storage/employees/1/pic.jpg',
            PublicStorageUrl::forPath('employees\\1\\pic.jpg'),
        );
    }

    public function test_for_path_returns_bucket_url_on_s3_disk(): void
    {
        config([
            'filesystems.disks.public' => [
                'driver' => 's3',
                'key' => 'test-key',
                'secret' => 'test-secret',
                'region' => 'us-east-1',
                'bucket' => 'test-bucket',
                'url' => 'https://test-bucket.s3.amazonaws.com',
                'options' => ['ACL' => ''],
                'retain_visibility' => false,
                'visibility' => 'public',
                'throw' => false,
                'report' => false,
                'temporary_url_ttl_minutes' => 0,
            ],
        ]);

        $this->assertSame(
            'https://test-bucket.s3.amazonaws.com/employees/1/pic.jpg',
            PublicStorageUrl::forPath('employees/1/pic.jpg'),
        );
    }

    public function test_for_path_returns_signed_url_on_private_s3_disk(): void
    {
        config([
            'filesystems.disks.public' => [
                'driver' => 's3',
                'key' => 'test-key',
                'secret' => 'test-secret',
                'region' => 'us-east-1',
                'bucket' => 'test-bucket',
                'url' => 'https://test-bucket.s3.amazonaws.com',
                'options' => ['ACL' => ''],
                'retain_visibility' => false,
                'visibility' => 'public',
                'temporary_url_ttl_minutes' => 60,
                'throw' => false,
                'report' => false,
            ],
        ]);

        $url = PublicStorageUrl::forPath('employees/1/pic.jpg');

        $this->assertNotNull($url);
        $this->assertStringStartsWith('https://test-bucket.s3.amazonaws.com/employees/1/pic.jpg', $url);
        $this->assertStringContainsString('X-Amz-Signature=', $url);
    }

    public function test_data_uri_for_path_embeds_public_disk_image(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('company-profiles/1/logo.webp', 'fake-webp-bytes');

        $dataUri = PublicStorageUrl::dataUriForPath('company-profiles/1/logo.webp');

        $this->assertNotNull($dataUri);
        $this->assertStringStartsWith('data:image/webp;base64,', $dataUri);
    }
}
