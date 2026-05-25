<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$host = parse_url($base, PHP_URL_HOST);
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

foreach ([(string) time(), (string) (time() - 1)] as $sessionId) {
    $jar = GuzzleHttp\Cookie\CookieJar::fromArray(['SessionID' => $sessionId], $host);
    $client = new GuzzleHttp\Client(['timeout' => 20, 'cookies' => $jar, 'allow_redirects' => false]);
    $client->get($base.'/csl/login');
    $client->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]]);
    $index = (string) $client->get($base.'/csl/report')->getBody();
    echo 'session '.$sessionId.' index len='.strlen($index).' form='.(str_contains($index, 'name=mainform') ? 'y' : 'n')."\n";
}

// Raw until cookie appears
for ($i = 0; $i < 3; $i++) {
    $fp = fsockopen($host, 80, $errno, $errstr, 10);
    fwrite($fp, "GET / HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
    $raw = stream_get_contents($fp);
    fclose($fp);
    $has = preg_match('/SessionID=([^;\s]+)/i', $raw, $m) ? $m[1] : 'none';
    echo "attempt {$i}: len=".strlen($raw).' session='.$has."\n";
    usleep(200000);
}
