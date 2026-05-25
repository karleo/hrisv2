<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$host = parse_url($base, PHP_URL_HOST);
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$try = function (string $sessionId) use ($base, $host, $user, $pass): void {
    $jar = GuzzleHttp\Cookie\CookieJar::fromArray(['SessionID' => $sessionId], $host);
    $client = new GuzzleHttp\Client(['timeout' => 20, 'cookies' => $jar, 'allow_redirects' => false]);
    $client->get($base.'/csl/login');
    $check = (string) $client->post($base.'/csl/check', [
        'form_params' => ['username' => $user, 'userpwd' => $pass],
    ])->getBody();
    $index = (string) $client->get($base.'/csl/report')->getBody();
    echo "sid={$sessionId} check=".($check !== '' ? 'ok' : 'empty')
        .' mainform='.(str_contains($index, 'mainform') ? 'y' : 'n')
        .' len='.strlen($index)."\n";
};

// Logout paths
foreach (['/csl/logout', '/csl/Logout', '/logout'] as $logout) {
    $fp = fsockopen($host, 80, $errno, $errstr, 10);
    if (! is_resource($fp)) {
        continue;
    }
    fwrite($fp, "GET {$logout} HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
    $raw = stream_get_contents($fp);
    fclose($fp);
    preg_match('/SessionID=([^;\s]+)/i', $raw, $m);
    echo "GET {$logout} len=".strlen($raw).' cookie='.($m[1] ?? 'none')."\n";
}

// Fresh GET / after logout attempt
$fp = fsockopen($host, 80, $errno, $errstr, 10);
fwrite($fp, "GET / HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
$raw = stream_get_contents($fp);
fclose($fp);
preg_match('/SessionID=([^;\s]+)/i', $raw, $m);
echo 'GET / after logout len='.strlen($raw).' cookie='.($m[1] ?? 'none')."\n";

if (isset($m[1])) {
    $try($m[1]);
}

for ($t = time(); $t >= time() - 5; $t--) {
    $try((string) $t);
}
