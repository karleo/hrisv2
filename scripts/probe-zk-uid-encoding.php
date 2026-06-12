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
$sessionId = $m[1] ?? '';

$jar = GuzzleHttp\Cookie\CookieJar::fromArray(['SessionID' => $sessionId], $host);
$client = new GuzzleHttp\Client(['timeout' => 20, 'cookies' => $jar]);
$client->get($base.'/csl/login');
$client->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]]);
$index = (string) $client->get($base.'/csl/report')->getBody();
preg_match_all('/name=uid\s+value=(\d+)/i', $index, $uids);
$allUids = $uids[1] ?? [];

$buildBody = function (array $uids): string {
    $parts = ['sdate=2026-05-22', 'edate=2026-05-22', 'period=0'];
    foreach ($uids as $uid) {
        $parts[] = 'uid='.urlencode((string) $uid);
    }

    return implode('&', $parts);
};

$parser = app(App\Services\Biometric\ZkDeviceWebReportHtmlParser::class);

foreach ([array_slice($allUids, 0, 3), $allUids] as $i => $subset) {
    $body = (string) $client->post($base.'/csl/report?action=run', [
        'body' => $buildBody($subset),
        'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
    ])->getBody();

    $punches = $parser->parse($body, $device->timezone);
    echo "subset{$i} uids=".count($subset).' len='.strlen($body).' punches='.count($punches)."\n";
}

// Show what Guzzle array encoding produces
echo 'array encoding: '.http_build_query(['uid' => $allUids, 'sdate' => '2026-05-22', 'edate' => '2026-05-22'])."\n";
