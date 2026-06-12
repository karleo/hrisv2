<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$d = App\Models\BiometricDevice::query()->find(12);
echo 'type='.$d->connection_type->value.' port='.$d->port.' host='.$d->host."\n";
echo 'baseUrl='.$d->deviceWebBaseUrl()."\n";
