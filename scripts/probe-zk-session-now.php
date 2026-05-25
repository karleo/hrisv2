<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$client = app(App\Services\Biometric\ZkDeviceWebReportClient::class);

try {
    $client->testLogin($device);
    echo "testLogin: OK\n";
} catch (Throwable $e) {
    echo 'testLogin: FAIL '.$e->getMessage()."\n";
}

$base = rtrim($device->deviceWebBaseUrl(), '/');
$host = parse_url($base, PHP_URL_HOST);
$port = $device->port > 0 ? $device->port : 80;

foreach (['/', '/csl/login'] as $path) {
    $fp = fsockopen($host, $port, $errno, $errstr, 10);
    if (! is_resource($fp)) {
        echo "{$path}: connect fail {$errstr}\n";

        continue;
    }
    fwrite($fp, "GET {$path} HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
    $raw = stream_get_contents($fp);
    fclose($fp);
    $has = preg_match('/SessionID=([^;\s]+)/i', (string) $raw, $m) === 1;
    echo "{$path}: SessionID=".($has ? $m[1] : 'none').' len='.strlen((string) $raw)."\n";
}

$override = $device->metadata['web_session_id'] ?? '';
echo 'saved web_session_id='.$override."\n";
