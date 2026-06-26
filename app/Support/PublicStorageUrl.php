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
}
