<?php

namespace App\Services\Storage;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class StorageLinkMaintenanceService
{
    /**
     * Detect whether the application is configured to store uploads on AWS S3
     * instead of the local public disk that requires a public/storage symlink.
     */
    public function usesObjectStorage(): bool
    {
        $defaultDisk = (string) config('filesystems.default', 'local');

        if ($defaultDisk === 's3') {
            return true;
        }

        return (string) config('filesystems.disks.public.driver', 'local') === 's3';
    }

    /**
     * Read-only snapshot for the storage maintenance UI (sidebar settings page).
     *
     * @return array{
     *     mode: 'local'|'s3',
     *     default_disk: string,
     *     public_disk_driver: string,
     *     symlink: array{
     *         link: string,
     *         target: string,
     *         exists: bool,
     *         is_link: bool,
     *         current_target: string|null,
     *         healthy: bool,
     *     },
     *     s3: array{
     *         configured: bool,
     *         bucket: string|null,
     *         region: string|null,
     *         url: string|null,
     *     },
     *     instructions: list<string>,
     * }
     */
    public function inspect(): array
    {
        $usesObjectStorage = $this->usesObjectStorage();
        /** @var array<string, string> $links */
        $links = (array) config('filesystems.links', []);
        $linkPath = (string) array_key_first($links);
        $targetPath = (string) ($links[$linkPath] ?? storage_path('app/public'));

        $isLink = is_link($linkPath);
        $currentTarget = $isLink ? readlink($linkPath) : null;

        return [
            'mode' => $usesObjectStorage ? 's3' : 'local',
            'default_disk' => (string) config('filesystems.default', 'local'),
            'public_disk_driver' => (string) config('filesystems.disks.public.driver', 'local'),
            'symlink' => [
                'link' => $linkPath,
                'target' => $targetPath,
                'exists' => file_exists($linkPath) || is_link($linkPath),
                'is_link' => $isLink,
                'current_target' => is_string($currentTarget) ? $currentTarget : null,
                'healthy' => $isLink && $currentTarget === $targetPath,
            ],
            's3' => [
                'configured' => $this->hasS3Configuration(),
                'bucket' => $this->nullableConfigString('filesystems.disks.s3.bucket'),
                'region' => $this->nullableConfigString('filesystems.disks.s3.region'),
                'url' => $this->nullableConfigString('filesystems.disks.s3.url'),
            ],
            'instructions' => $this->instructions(),
        ];
    }

    /**
     * Guidance shown in the UI and Artisan command after maintenance runs.
     *
     * @return list<string>
     */
    public function instructions(): array
    {
        if ($this->usesObjectStorage()) {
            return [
                'Set the storage driver to AWS S3 in the configuration section above (or FILESYSTEM_DISK=s3 in .env).',
                'Fill AWS access key, secret, region, bucket, and optional public URL base.',
                'Ensure the IAM user can s3:PutObject, s3:GetObject, and s3:DeleteObject on the bucket.',
                'Save settings, then run storage maintenance to verify bucket access.',
            ];
        }

        return [
            'Choose Local disk in the configuration section above (or keep FILESYSTEM_DISK=local in .env).',
            'Run storage maintenance after each deploy so public/storage points to storage/app/public.',
            'If public/storage already exists as a folder or file, enable force recreate before running.',
            'On Windows, enable Developer Mode or run the terminal as Administrator if symlink creation fails.',
        ];
    }

    /**
     * Run the correct maintenance routine for the active storage backend.
     *
     * Local: ensure storage/app/public exists and public/storage symlinks to it.
     * S3: verify credentials and bucket read/write access (no symlink needed).
     *
     * @return list<string>
     */
    public function run(bool $force = false): array
    {
        if ($this->usesObjectStorage()) {
            return $this->maintainObjectStorage();
        }

        return $this->maintainLocalStorageLinks($force);
    }

    /**
     * Local public files live in storage/app/public. The web server only serves
     * them at /storage when the symlink defined in config/filesystems.php exists.
     *
     * @return list<string>
     */
    public function maintainLocalStorageLinks(bool $force = false): array
    {
        $messages = [];
        $publicRoot = storage_path('app/public');

        if (! is_dir($publicRoot)) {
            if (! File::makeDirectory($publicRoot, 0755, true)) {
                throw new RuntimeException("Unable to create directory [{$publicRoot}].");
            }

            $messages[] = "Created directory [{$publicRoot}].";
        }

        /** @var array<string, string> $links */
        $links = (array) config('filesystems.links', []);

        foreach ($links as $link => $target) {
            $messages = array_merge(
                $messages,
                $this->ensureSymbolicLink((string) $link, (string) $target, $force),
            );
        }

        return $messages;
    }

    /**
     * S3 buckets expose files over HTTPS. The app server does not need
     * public/storage when FILESYSTEM_DISK=s3 (or the public disk uses the s3 driver).
     *
     * @return list<string>
     */
    public function maintainObjectStorage(): array
    {
        $this->assertS3ConfigurationIsPresent();

        $disk = Storage::disk('s3');
        $probePath = '.storage-maintenance-'.uniqid('', true);

        $disk->put($probePath, 'ok');

        if (! $disk->exists($probePath)) {
            throw new RuntimeException('S3 write probe failed: file was not found after upload.');
        }

        $disk->delete($probePath);

        $messages = [
            'Object storage mode (S3): no public/storage symlink is required on the app server.',
            'S3 bucket connection verified (write and delete probe succeeded).',
            'Bucket: '.(string) config('filesystems.disks.s3.bucket'),
            'Region: '.(string) config('filesystems.disks.s3.region'),
        ];

        $url = config('filesystems.disks.s3.url');

        if (is_string($url) && $url !== '') {
            $messages[] = 'Public URL base: '.$url;
        }

        return $messages;
    }

    /**
     * @return list<string>
     */
    private function ensureSymbolicLink(string $link, string $target, bool $force): array
    {
        $messages = [];

        if (! is_dir($target) && ! File::makeDirectory($target, 0755, true)) {
            throw new RuntimeException("Unable to create target directory [{$target}].");
        }

        if (file_exists($link) || is_link($link)) {
            if (is_link($link)) {
                $currentTarget = readlink($link);

                if ($currentTarget === $target && ! $force) {
                    $messages[] = "Symbolic link already exists [{$link}] -> [{$target}].";

                    return $messages;
                }

                if (! unlink($link)) {
                    throw new RuntimeException("Unable to remove existing symbolic link [{$link}].");
                }

                $messages[] = "Removed existing symbolic link [{$link}].";
            } elseif ($force) {
                if (is_dir($link)) {
                    File::deleteDirectory($link);
                } elseif (! unlink($link)) {
                    throw new RuntimeException("Unable to remove existing path [{$link}].");
                }

                $messages[] = "Removed existing path [{$link}].";
            } else {
                throw new RuntimeException(
                    "The [{$link}] path already exists and is not a symbolic link. Re-run with --force to replace it.",
                );
            }
        }

        if (! symlink($target, $link)) {
            throw new RuntimeException("Unable to create symbolic link [{$link}] -> [{$target}].");
        }

        $messages[] = "Created symbolic link [{$link}] -> [{$target}].";

        return $messages;
    }

    private function assertS3ConfigurationIsPresent(): void
    {
        if ($this->hasS3Configuration()) {
            return;
        }

        throw new RuntimeException('Missing environment variable [AWS_ACCESS_KEY_ID] required for S3 storage.');
    }

    private function hasS3Configuration(): bool
    {
        $requiredConfig = [
            'filesystems.disks.s3.key',
            'filesystems.disks.s3.secret',
            'filesystems.disks.s3.region',
            'filesystems.disks.s3.bucket',
        ];

        foreach ($requiredConfig as $configKey) {
            $value = config($configKey);

            if (! is_string($value) || $value === '') {
                return false;
            }
        }

        return true;
    }

    private function nullableConfigString(string $configKey): ?string
    {
        $value = config($configKey);

        return is_string($value) && $value !== '' ? $value : null;
    }
}
