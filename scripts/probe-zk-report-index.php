<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$client = app(App\Services\Biometric\ZkDeviceWebReportClient::class);

try {
    $client->testLogin($device);
    echo "testLogin OK\n";
} catch (Throwable $e) {
    echo 'testLogin FAIL: '.$e->getMessage()."\n";
}

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
echo "fresh sid={$sid}\n";

$jar = GuzzleHttp\Cookie\CookieJar::fromArray(['SessionID' => $sid], $host);
$g = new GuzzleHttp\Client(['timeout' => 20, 'cookies' => $jar, 'allow_redirects' => false]);
$g->get($base.'/csl/login');
$g->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]]);
$html = (string) $g->get($base.'/csl/report')->getBody();
echo 'report len='.strlen($html).' mainform='.(str_contains($html, 'mainform') ? 'y' : 'n');
echo ' uids='.preg_match_all('/name=uid\s+value=(\d+)/i', $html)."\n";

if (strlen($html) < 500) {
    echo $html."\n";
}
