<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$host = parse_url($base, PHP_URL_HOST);
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$fp = fsockopen($host, 80, $errno, $errstr, 15);
fwrite($fp, "GET / HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
$raw = stream_get_contents($fp);
fclose($fp);
preg_match('/SessionID=([^;\s]+)/i', $raw, $m);

$client = new GuzzleHttp\Client([
    'timeout' => 20,
    'cookies' => GuzzleHttp\Cookie\CookieJar::fromArray(['SessionID' => $m[1] ?? ''], $host),
]);
$client->get($base.'/csl/login');
$client->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]]);

$all = [];

for ($first = 0; $first <= 100; $first += 20) {
    $path = $first === 0 ? '/csl/report' : "/csl/report?first={$first}&last=".($first + 20);
    $html = (string) $client->get($base.$path)->getBody();
    preg_match_all('/name=uid\s+value=(\d+)/i', $html, $uids);
    $found = $uids[1] ?? [];
    echo "{$path}: ".count($found)." uids\n";
    $all = array_merge($all, $found);

    if ($found === []) {
        break;
    }
}

$all = array_values(array_unique($all));
echo 'total unique uids: '.count($all)."\n";
