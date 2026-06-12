<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$host = parse_url($base, PHP_URL_HOST);
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$fp = fsockopen($host, 80, $errno, $errstr, 10);
fwrite($fp, "GET / HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
$raw = stream_get_contents($fp);
fclose($fp);
preg_match('/SessionID=([^;\s]+)/i', $raw, $m);
$sid = $m[1] ?? '';
echo "sid={$sid}\n";

$jar = GuzzleHttp\Cookie\CookieJar::fromArray(['SessionID' => $sid], $host);
$client = new GuzzleHttp\Client(['timeout' => 20, 'cookies' => $jar, 'allow_redirects' => false]);
$client->get($base.'/csl/login');
$check = (string) $client->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]])->getBody();
echo 'check fail='.(str_contains($check, 'Error Input') ? 'y' : 'n').' redirect='.(str_contains($check, "location.href='/'") ? 'y' : 'n')."\n";

for ($first = 0; $first <= 100; $first += 20) {
    $path = $first === 0 ? '/csl/report' : "/csl/report?first={$first}&last=".($first + 20);
    $html = (string) $client->get($base.$path)->getBody();
    preg_match_all('/name=uid\s+value=(\d+)/i', $html, $uids);
    $count = count($uids[1] ?? []);
    echo "{$path} len=".strlen($html)." uids={$count}\n";
    if ($count === 0 && strlen($html) < 500) {
        echo strip_tags($html)."\n";
        break;
    }
}
