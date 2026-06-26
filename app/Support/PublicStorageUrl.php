<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

final class PublicStorageUrl
{
    /**
     * Browser URL for a file stored on the public disk.
     *
     * Local disk: host-relative /storage/... so uploads work when APP_URL differs from the visit host.
     * S3: absolute bucket URL from the configured public disk.
     */
    public static function forPath(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        $normalized = str_replace('\\', '/', ltrim($path, '/'));

        if ((string) config('filesystems.disks.public.driver', 'local') === 's3') {
            $disk = Storage::disk('public');
            $ttlMinutes = (int) config('filesystems.disks.public.temporary_url_ttl_minutes', 1440);

            if ($ttlMinutes > 0) {
                return $disk->temporaryUrl($normalized, now()->addMinutes($ttlMinutes));
            }

            return $disk->url($normalized);
        }

        return '/storage/'.$normalized;
    }

    /**
     * Base64 data URI for embedding images in PDFs (works on local disk and S3).
     */
    public static function dataUriForPath(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        $normalized = str_replace('\\', '/', ltrim($path, '/'));
        $disk = Storage::disk('public');

        if (! $disk->exists($normalized)) {
            return null;
        }

        $contents = $disk->get($normalized);

        if ($contents === null || $contents === '') {
            return null;
        }

        try {
            $mime = $disk->mimeType($normalized);
        } catch (\Throwable) {
            $mime = self::guessImageMimeType($normalized);
        }

        if (! is_string($mime) || ! str_starts_with($mime, 'image/')) {
            $mime = self::guessImageMimeType($normalized);
        }

        if ($mime === null) {
            return null;
        }

        return 'data:'.$mime.';base64,'.base64_encode($contents);
    }

    private static function guessImageMimeType(string $path): ?string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
            default => null,
        };
    }
}
