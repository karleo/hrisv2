<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\Biometric\ZkDeviceWebHttpTransport;

$device = App\Models\BiometricDevice::query()->find(12);
$host = trim((string) $device->host);
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$transport = new ZkDeviceWebHttpTransport($host, $device->port ?: 80);
$transport->connect();

$transport->request('GET', '/');
$transport->request('GET', '/csl/login', keepAlive: true);

$loginResponses = $transport->request('POST', '/csl/check', [
    'username' => $user,
    'userpwd' => $pass,
], keepAlive: true);

echo 'login responses: '.count($loginResponses)."\n";

foreach ($loginResponses as $i => $raw) {
    $body = $transport->responseBody($raw);
    echo "  login[{$i}] len=".strlen($body).' redirect='.(str_contains($body, "location.href='/'") ? 'y' : 'n')."\n";
}

$paths = [
    '/csl/report',
    '/csl/report?action=run&sdate=2026-05-14&edate=2026-05-22',
];

foreach ($paths as $path) {
    $responses = $transport->request('GET', $path, keepAlive: true);
    echo $path.' responses='.count($responses)."\n";

    foreach ($responses as $i => $raw) {
        $body = $transport->responseBody($raw);
        echo "  [{$i}] len=".strlen($body).' idn='.(stripos($body, 'id number') !== false ? 'y' : 'n')
            .' tr='.preg_match_all('/<tr/i', $body)."\n";

        if (stripos($body, 'id number') !== false) {
            file_put_contents(__DIR__.'/zk-probe-output/transport-hit.html', $body);
        }
    }
}

$postResponses = $transport->request('POST', '/csl/report', [
    'action' => 'run',
    'sdate' => '2026-05-14',
    'edate' => '2026-05-22',
    'username' => $user,
    'userpwd' => $pass,
], keepAlive: true);

echo 'POST report responses='.count($postResponses)."\n";
foreach ($postResponses as $i => $raw) {
    $body = $transport->responseBody($raw);
    echo "  post[{$i}] len=".strlen($body).' idn='.(stripos($body, 'id number') !== false ? 'y' : 'n')."\n";
}

$transport->close();
