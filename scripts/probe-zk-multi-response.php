<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$host = parse_url($base, PHP_URL_HOST);
$port = parse_url($base, PHP_URL_PORT) ?: 80;

$fp = @fsockopen($host, (int) $port, $errno, $errstr, 15);

if (! is_resource($fp)) {
    fwrite(STDERR, "connect failed: {$errstr}\n");
    exit(1);
}

$request = function (string $method, string $path, ?string $body = null) use ($fp): string {
    $payload = $body ?? '';
    $headers = "Host: {$GLOBALS['host']}\r\n";
    $headers .= "User-Agent: Mozilla/5.0\r\n";
    $headers .= "Connection: close\r\n";

    if ($body !== null) {
        $headers .= "Content-Type: application/x-www-form-urlencoded\r\n";
        $headers .= 'Content-Length: '.strlen($payload)."\r\n";
    }

    $raw = "{$method} {$path} HTTP/1.0\r\n{$headers}\r\n{$payload}";
    fwrite($fp, $raw);

    $response = '';

    while (! feof($fp)) {
        $chunk = fread($fp, 8192);

        if ($chunk === false || $chunk === '') {
            break;
        }

        $response .= $chunk;
    }

    return $response;
};

$split = function (string $raw): array {
    $parts = preg_split('/(?=HTTP\/1\.[01] )/', $raw) ?: [];

    return array_values(array_filter($parts, fn (string $p): bool => trim($p) !== ''));
};

echo "=== POST check ===\n";
$checkRaw = $request('POST', '/csl/check', http_build_query([
    'username' => $device->deviceWebUsername(),
    'userpwd' => $device->deviceWebPassword(),
]));
$parts = $split($checkRaw);
echo 'parts='.count($parts)."\n";
foreach ($parts as $i => $part) {
    echo "--- part {$i} len=".strlen($part)." ---\n";
    echo substr($part, 0, 500)."\n";
}

// New connection for report after login won't work without cookies - try same script with keep-alive
fclose($fp);

$fp2 = @fsockopen($host, (int) $port, $errno, $errstr, 15);
$req2 = function (string $method, string $path, ?string $body = null) use ($fp2, $host): string {
    $payload = $body ?? '';
    $headers = "Host: {$host}\r\nUser-Agent: Mozilla/5.0\r\nConnection: Keep-Alive\r\n";

    if ($body !== null) {
        $headers .= "Content-Type: application/x-www-form-urlencoded\r\n";
        $headers .= 'Content-Length: '.strlen($payload)."\r\n";
    }

    fwrite($fp2, "{$method} {$path} HTTP/1.0\r\n{$headers}\r\n{$payload}");

    $response = '';

    while (! feof($fp2)) {
        $chunk = fread($fp2, 8192);

        if ($chunk === false || $chunk === '') {
            break;
        }

        $response .= $chunk;
    }

    return $response;
};

echo "\n=== Keep-Alive: login then report ===\n";
$loginRaw = $req2('POST', '/csl/check', http_build_query([
    'username' => $device->deviceWebUsername(),
    'userpwd' => $device->deviceWebPassword(),
]));
echo 'login raw len='.strlen($loginRaw)."\n";

// Same socket - second request
$reportRaw = '';
fwrite($fp2, "GET /csl/report?action=run&sdate=2026-05-14&edate=2026-05-22 HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");

while (! feof($fp2)) {
    $chunk = fread($fp2, 8192);

    if ($chunk === false || $chunk === '') {
        break;
    }

    $reportRaw .= $chunk;
}

echo 'report raw len='.strlen($reportRaw).' idn='.(stripos($reportRaw, 'id number') !== false ? 'y' : 'n')."\n";

if (stripos($reportRaw, 'id number') !== false) {
    file_put_contents(__DIR__.'/zk-probe-output/keepalive-report.html', $reportRaw);
}

fclose($fp2);
