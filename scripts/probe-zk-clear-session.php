<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $client = app(App\Services\Biometric\ZkDeviceWebReportClient::class);
    $device = App\Models\BiometricDevice::query()->find(12);
    $client->testLogin($device);
    echo "testLogin: OK\n";

    $from = Illuminate\Support\Carbon::parse('2026-05-14', $device->timezone)->startOfDay()->utc();
    $until = Illuminate\Support\Carbon::parse('2026-05-22', $device->timezone)->endOfDay()->utc();
    $punches = $client->fetchPunches($device, $from, $until);
    echo 'punches='.count($punches)."\n";
} catch (Throwable $e) {
    echo 'ERROR: '.$e->getMessage()."\n";
    exit(1);
}
