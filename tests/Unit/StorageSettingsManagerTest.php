<?php

namespace Tests\Unit;

use App\Services\Storage\StorageSettingsManager;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class StorageSettingsManagerTest extends TestCase
{
    #[DataProvider('s3PublicUrlProvider')]
    public function test_normalize_s3_public_url_strips_local_storage_suffix(?string $input, ?string $expected): void
    {
        $this->assertSame($expected, StorageSettingsManager::normalizeS3PublicUrl($input));
    }

    /**
     * @return array<string, array{0: string|null, 1: string|null}>
     */
    public static function s3PublicUrlProvider(): array
    {
        return [
            'null' => [null, null],
            'empty' => ['', ''],
            'bucket url' => ['https://bucket.s3.amazonaws.com', 'https://bucket.s3.amazonaws.com'],
            'trailing slash' => ['https://bucket.s3.amazonaws.com/', 'https://bucket.s3.amazonaws.com'],
            'local storage suffix' => ['https://bucket.s3.amazonaws.com/storage/', 'https://bucket.s3.amazonaws.com'],
            'local storage suffix no slash' => ['https://bucket.s3.amazonaws.com/storage', 'https://bucket.s3.amazonaws.com'],
        ];
    }
}
