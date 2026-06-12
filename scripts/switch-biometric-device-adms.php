<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$deviceId = (int) ($argv[1] ?? 12);
$device = App\Models\BiometricDevice::query()->find($deviceId);

if ($device === null) {
    fwrite(STDERR, "Device #{$deviceId} not found.\n");
    exit(1);
}

$device->update([
    'connection_type' => App\Enums\BiometricConnectionType::AdmsPush,
    'last_error' => null,
    'last_sync_status' => null,
    'metadata' => array_merge($device->metadata ?? [], [
        'protocol' => 'tcp',
        'switched_to_adms_at' => now()->toIso8601String(),
    ]),
]);

$device->refresh();

echo "Device #{$device->id} ({$device->name}): {$device->connection_type->value}\n";
echo 'Terminal cloud server URL: '.App\Support\BiometricPushUrl::cdataEndpoint()."\n";
echo "Serial on device must match: {$device->serial_number}\n";
