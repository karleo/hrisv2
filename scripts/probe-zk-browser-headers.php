<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$browserHeaders = [
    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language' => 'en-US,en;q=0.9',
];

$client = new GuzzleHttp\Client([
    'timeout' => 20,
    'cookies' => new GuzzleHttp\Cookie\CookieJar,
    'allow_redirects' => false,
    'headers' => $browserHeaders,
]);

$client->get($base.'/csl/login');
$client->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]]);

$res = $client->get($base.'/csl/report?action=run&sdate=2026-05-14&edate=2026-05-22', [
    'headers' => ['Referer' => $base.'/csl/login'],
]);
$body = (string) $res->getBody();
$bodies = App\Services\Biometric\ZkDeviceWebHttpTransport::bodiesFromPsrBody($body);
echo 'bodies='.count($bodies)."\n";
foreach ($bodies as $i => $html) {
    echo "body[{$i}] len=".strlen($html).' idn='.(stripos($html, 'id number') !== false ? 'y' : 'n')."\n";
}
