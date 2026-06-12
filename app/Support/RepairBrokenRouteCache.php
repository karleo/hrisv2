<?php

namespace App\Support;

use Illuminate\Contracts\Foundation\Application;

final class RepairBrokenRouteCache
{
    public static function apply(Application $app): void
    {
        $cachedRoutesPath = $app->getCachedRoutesPath();

        if (is_file($cachedRoutesPath)) {
            return;
        }

        foreach (glob($app->basePath('bootstrap/cache/routes-*.php')) ?: [] as $routeCacheFile) {
            if (is_file($routeCacheFile)) {
                @unlink($routeCacheFile);
            }
        }

        $app->instance('routes.cached', false);
    }
}
