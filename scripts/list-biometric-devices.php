<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$devices = App\Models\BiometricDevice::query()->orderBy('id')->get(['id', 'name', 'host', 'connection_type', 'is_active']);

if ($devices->isEmpty()) {
    echo "No biometric devices in database.\n";

    exit(0);
}

foreach ($devices as $device) {
    echo $device->id.' | '.$device->name.' | '.($device->host ?? '—').' | '.$device->connection_type->value.' | active='.($device->is_active ? 'yes' : 'no')."\n";
}
