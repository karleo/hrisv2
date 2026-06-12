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
    'connection_type' => App\Enums\BiometricConnectionType::DeviceWebReport,
    'port' => 80,
    'last_error' => null,
    'last_sync_status' => null,
    'metadata' => array_merge($device->metadata ?? [], [
        'protocol' => 'tcp',
        'switched_to_device_web_at' => now()->toIso8601String(),
    ]),
]);

$device->refresh();

$host = $device->host ?? 'DEVICE_IP';

echo "Device #{$device->id} ({$device->name}): {$device->connection_type->value}\n";
echo "Report URL: http://{$host}/csl/report?action=run\n";
echo "Import in HRIS: Biometric → Import attendance — use dates from the device report (e.g. 2024-05-21 to 2024-05-22).\n";
echo "Set employee biometric_user_id to device PIN (e.g. 55).\n";
