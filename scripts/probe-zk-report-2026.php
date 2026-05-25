<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);

if ($device === null) {
    fwrite(STDERR, "Device 12 not found\n");
    exit(1);
}

$client = app(App\Services\Biometric\ZkDeviceWebReportClient::class);
$parser = app(App\Services\Biometric\ZkDeviceWebReportHtmlParser::class);

$from = Illuminate\Support\Carbon::parse('2026-05-14', $device->timezone)->startOfDay()->utc();
$until = Illuminate\Support\Carbon::parse('2026-05-22', $device->timezone)->endOfDay()->utc();

try {
    $punches = $client->fetchPunches($device, $from, $until);
    echo 'punches='.count($punches)."\n";
    foreach (array_slice($punches, 0, 5) as $p) {
        echo $p->deviceUserId.' '.$p->punchedAt->toIso8601String().' '.$p->direction->value."\n";
    }
} catch (Throwable $e) {
    echo 'ERROR: '.$e->getMessage()."\n";
    exit(1);
}
