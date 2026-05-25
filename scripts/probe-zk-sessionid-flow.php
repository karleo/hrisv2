<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();
$host = parse_url($base, PHP_URL_HOST);

$extractSessionId = function (string $rawHeaders): ?string {
    if (preg_match('/Set-Cookie:\s*SessionID=([^;\s]+)/i', $rawHeaders, $m) === 1) {
        return $m[1];
    }

    return null;
};

$request = function (string $method, string $path, ?string $body = null, ?string $sessionId = null) use ($host): string {
    $fp = fsockopen($host, 80, $errno, $errstr, 15);

    if (! is_resource($fp)) {
        throw new RuntimeException($errstr);
    }

    $headers = "Host: {$host}\r\nUser-Agent: HRIS\r\nConnection: close\r\n";

    if ($sessionId !== null) {
        $headers .= "Cookie: SessionID={$sessionId}\r\n";
    }

    if ($body !== null) {
        $headers .= "Content-Type: application/x-www-form-urlencoded\r\n";
        $headers .= 'Content-Length: '.strlen($body)."\r\n";
    }

    fwrite($fp, "{$method} {$path} HTTP/1.0\r\n{$headers}\r\n".($body ?? ''));

    $raw = (string) stream_get_contents($fp);
    fclose($fp);

    return $raw;
};

$rawRoot = $request('GET', '/');
$sessionId = $extractSessionId($rawRoot);
echo 'SessionID from GET /: '.($sessionId ?? 'none')."\n";

$request('POST', '/csl/check', http_build_query(['username' => $user, 'userpwd' => $pass]), $sessionId);
$reportRaw = $request('GET', '/csl/report?action=run&sdate=2026-05-14&edate=2026-05-22', null, $sessionId);

$parts = preg_split('/\r\n\r\n/', $reportRaw, 2);
$reportBody = $parts[1] ?? '';
echo 'report len='.strlen($reportBody).' idn='.(stripos($reportBody, 'id number') !== false ? 'y' : 'n')
    .' tr='.preg_match_all('/<tr/i', $reportBody)."\n";

if (stripos($reportBody, 'id number') !== false) {
    file_put_contents(__DIR__.'/zk-probe-output/sessionid-report.html', $reportBody);
    echo "saved sessionid-report.html\n";
}

// Guzzle with manual cookie
$jar = GuzzleHttp\Cookie\CookieJar::fromArray(
    ['SessionID' => $sessionId ?? ''],
    $host,
);
$client = new GuzzleHttp\Client(['timeout' => 20, 'cookies' => $jar]);
$client->get($base.'/csl/login');
$client->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]]);
$gBody = (string) $client->get($base.'/csl/report?action=run&sdate=2026-05-14&edate=2026-05-22')->getBody();
echo 'guzzle with manual cookie: len='.strlen($gBody).' idn='.(stripos($gBody, 'id number') !== false ? 'y' : 'n')."\n";
