<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$client = app(App\Services\Biometric\ZkDeviceWebReportClient::class);

$from = Illuminate\Support\Carbon::parse('2026-05-14', $device->timezone)->startOfDay()->utc();
$until = Illuminate\Support\Carbon::parse('2026-05-22', $device->timezone)->endOfDay()->utc();

$punches = $client->fetchPunches($device, $from, $until);
echo 'punches='.count($punches)."\n";
foreach (array_slice($punches, 0, 10) as $p) {
    echo $p->deviceUserId.' '.$p->punchedAt->toIso8601String()."\n";
}
