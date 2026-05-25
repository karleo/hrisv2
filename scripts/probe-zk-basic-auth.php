<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$client = new GuzzleHttp\Client([
    'timeout' => 20,
    'auth' => [$user, $pass],
    'headers' => ['User-Agent' => 'Mozilla/5.0'],
]);

$paths = [
    '/csl/report?action=run&sdate=2026-05-14&edate=2026-05-22',
    '/csl/report',
];

foreach ($paths as $path) {
    $body = (string) $client->get($base.$path)->getBody();
    echo $path.' len='.strlen($body).' idn='.(stripos($body, 'id number') !== false ? 'y' : 'n')
        .' login='.(str_contains($body, 'name=myform') ? 'y' : 'n')."\n";

    if (stripos($body, 'id number') !== false) {
        file_put_contents(__DIR__.'/zk-probe-output/basic-auth-hit.html', $body);
    }
}
