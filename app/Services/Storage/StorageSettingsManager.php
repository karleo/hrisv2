<?php

namespace App\Services\Storage;

use App\Models\StorageSetting;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class StorageSettingsManager
{
    private const CACHE_KEY = 'storage_settings.resolved';

    private const CACHE_SECONDS = 300;

    private ?string $lastAppliedHash = null;

    public function __construct(
        private readonly CacheRepository $cache,
    ) {}

    public function forgetCache(): void
    {
        $this->cache->forget(self::CACHE_KEY);
    }

    /**
     * @return array{
     *     driver: 'local'|'s3',
     *     source: 'database'|'env',
     *     aws_access_key_id: string|null,
     *     aws_secret_access_key: string|null,
     *     aws_default_region: string|null,
     *     aws_bucket: string|null,
     *     aws_url: string|null,
     *     aws_use_path_style_endpoint: bool,
     *     has_aws_secret: bool,
     * }
     */
    public function resolved(): array
    {
        return $this->cache->remember(self::CACHE_KEY, self::CACHE_SECONDS, function (): array {
            return $this->resolveUncached();
        });
    }

    /**
     * @param  array{
     *     driver: 'local'|'s3',
     *     source: 'database'|'env',
     *     aws_access_key_id: string|null,
     *     aws_secret_access_key: string|null,
     *     aws_default_region: string|null,
     *     aws_bucket: string|null,
     *     aws_url: string|null,
     *     aws_use_path_style_endpoint: bool,
     *     has_aws_secret: bool,
     * }  $resolved
     */
    public function applyResolved(array $resolved): void
    {
        $hash = md5(json_encode($resolved) ?: Str::random(16));
        if ($this->lastAppliedHash === $hash) {
            return;
        }

        if ($resolved['driver'] === StorageSetting::DRIVER_S3) {
            $s3Disk = $this->s3DiskConfig($resolved);

            config([
                'filesystems.default' => 's3',
                'filesystems.disks.s3' => $s3Disk,
                'filesystems.disks.public' => array_merge($s3Disk, [
                    'visibility' => 'public',
                ]),
            ]);
        } else {
            config([
                'filesystems.default' => 'local',
                'filesystems.disks.public' => [
                    'driver' => 'local',
                    'root' => storage_path('app/public'),
                    'url' => rtrim((string) config('app.url', 'http://localhost'), '/').'/storage',
                    'visibility' => 'public',
                    'throw' => false,
                    'report' => false,
                ],
            ]);
        }

        $this->lastAppliedHash = $hash;
    }

    /**
     * @return array{
     *     driver: 'local'|'s3',
     *     source: 'database'|'env',
     *     aws_access_key_id: string|null,
     *     aws_secret_access_key: string|null,
     *     aws_default_region: string|null,
     *     aws_bucket: string|null,
     *     aws_url: string|null,
     *     aws_use_path_style_endpoint: bool,
     *     has_aws_secret: bool,
     * }
     */
    public function applyLatest(): array
    {
        $resolved = $this->resolved();
        $this->applyResolved($resolved);

        return $resolved;
    }

    /**
     * @return array{
     *     driver: 'local'|'s3',
     *     source: 'database'|'env',
     *     aws_access_key_id: string|null,
     *     aws_secret_access_key: string|null,
     *     aws_default_region: string|null,
     *     aws_bucket: string|null,
     *     aws_url: string|null,
     *     aws_use_path_style_endpoint: bool,
     *     has_aws_secret: bool,
     * }
     */
    private function resolveUncached(): array
    {
        $fallback = $this->fallbackPayload();

        try {
            if (! Schema::hasTable('storage_settings')) {
                return $fallback;
            }

            $settings = StorageSetting::singleton();
            if ($settings === null) {
                return $fallback;
            }

            return [
                'driver' => $settings->usesS3() ? StorageSetting::DRIVER_S3 : StorageSetting::DRIVER_LOCAL,
                'source' => 'database',
                'aws_access_key_id' => $settings->aws_access_key_id,
                'aws_secret_access_key' => $settings->aws_secret_access_key,
                'aws_default_region' => $settings->aws_default_region,
                'aws_bucket' => $settings->aws_bucket,
                'aws_url' => $settings->aws_url,
                'aws_use_path_style_endpoint' => (bool) $settings->aws_use_path_style_endpoint,
                'has_aws_secret' => $settings->hasStoredSecret(),
            ];
        } catch (Throwable) {
            return $fallback;
        }
    }

    /**
     * @return array{
     *     driver: 'local'|'s3',
     *     source: 'database'|'env',
     *     aws_access_key_id: string|null,
     *     aws_secret_access_key: string|null,
     *     aws_default_region: string|null,
     *     aws_bucket: string|null,
     *     aws_url: string|null,
     *     aws_use_path_style_endpoint: bool,
     *     has_aws_secret: bool,
     * }
     */
    private function fallbackPayload(): array
    {
        $defaultDisk = (string) config('filesystems.default', 'local');
        $driver = $defaultDisk === 's3' ? StorageSetting::DRIVER_S3 : StorageSetting::DRIVER_LOCAL;
        $secret = config('filesystems.disks.s3.secret');

        return [
            'driver' => $driver,
            'source' => 'env',
            'aws_access_key_id' => $this->nullableConfigString('filesystems.disks.s3.key'),
            'aws_secret_access_key' => is_string($secret) && $secret !== '' ? $secret : null,
            'aws_default_region' => $this->nullableConfigString('filesystems.disks.s3.region'),
            'aws_bucket' => $this->nullableConfigString('filesystems.disks.s3.bucket'),
            'aws_url' => $this->nullableConfigString('filesystems.disks.s3.url'),
            'aws_use_path_style_endpoint' => (bool) config('filesystems.disks.s3.use_path_style_endpoint', false),
            'has_aws_secret' => is_string($secret) && $secret !== '',
        ];
    }

    private function nullableConfigString(string $configKey): ?string
    {
        $value = config($configKey);

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * @param  array{
     *     aws_access_key_id: string|null,
     *     aws_secret_access_key: string|null,
     *     aws_default_region: string|null,
     *     aws_bucket: string|null,
     *     aws_url: string|null,
     *     aws_use_path_style_endpoint: bool,
     * }  $resolved
     * @return array<string, mixed>
     */
    private function s3DiskConfig(array $resolved): array
    {
        return [
            'driver' => 's3',
            'key' => $resolved['aws_access_key_id'],
            'secret' => $resolved['aws_secret_access_key'],
            'region' => $resolved['aws_default_region'],
            'bucket' => $resolved['aws_bucket'],
            'url' => self::normalizeS3PublicUrl($resolved['aws_url']),
            'endpoint' => null,
            'use_path_style_endpoint' => $resolved['aws_use_path_style_endpoint'],
            // Buckets with Object Ownership (ACLs disabled) reject PutObject ACL headers.
            'options' => ['ACL' => ''],
            'retain_visibility' => false,
            'temporary_url_ttl_minutes' => (int) config('filesystems.disks.s3.temporary_url_ttl_minutes', 1440),
            'throw' => false,
            'report' => false,
        ];
    }

    public static function normalizeS3PublicUrl(?string $url): ?string
    {
        if (! is_string($url) || $url === '') {
            return $url;
        }

        $normalized = rtrim($url, '/');

        if (str_ends_with($normalized, '/storage')) {
            $normalized = substr($normalized, 0, -strlen('/storage'));
        }

        return $normalized !== '' ? $normalized : null;
    }
}
