<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| PHPUnit bootstrap
|--------------------------------------------------------------------------
|
| Route caching skips loading routes/web.php. If developers run
| `php artisan route:cache` locally, PHPUnit would otherwise boot with a
| stale route list and named routes added after the cache was built would
| be missing (RouteNotFoundException).
|
*/

$basePath = dirname(__DIR__);

foreach (glob($basePath.'/bootstrap/cache/routes-*.php') ?: [] as $routeCacheFile) {
    if (is_file($routeCacheFile)) {
        unlink($routeCacheFile);
    }
}

require $basePath.'/vendor/autoload.php';
