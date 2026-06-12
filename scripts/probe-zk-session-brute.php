<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$host = parse_url($base, PHP_URL_HOST);
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$trySession = function (string $sessionId) use ($base, $host, $user, $pass): bool {
    $jar = GuzzleHttp\Cookie\CookieJar::fromArray(['SessionID' => $sessionId], $host);
    $client = new GuzzleHttp\Client(['timeout' => 15, 'cookies' => $jar, 'allow_redirects' => false]);
    $client->get($base.'/csl/login');
    $check = (string) $client->post($base.'/csl/check', [
        'form_params' => ['username' => $user, 'userpwd' => $pass],
    ])->getBody();
    if (str_contains($check, 'Error Input')) {
        return false;
    }
    $index = (string) $client->get($base.'/csl/report')->getBody();

    return str_contains($index, 'name=mainform');
};

// Device-issued cookie from GET /
$fp = fsockopen($host, 80, $errno, $errstr, 10);
fwrite($fp, "GET / HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
$raw = stream_get_contents($fp);
fclose($fp);
preg_match('/SessionID=([^;\s]+)/i', $raw, $m);
echo 'GET / cookie='.($m[1] ?? 'none')."\n";

if (isset($m[1]) && $trySession($m[1])) {
    echo "device cookie works: {$m[1]}\n";
    exit(0);
}

// Try client-initiated SessionID (unix timestamp window)
$now = time();
for ($t = $now; $t >= $now - 120; $t--) {
    if ($trySession((string) $t)) {
        echo "client session works: {$t}\n";
        exit(0);
    }
}

echo "no working session found\n";
exit(1);
