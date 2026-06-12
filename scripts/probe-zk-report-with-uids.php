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
echo 'uids found: '.count($allUids)."\n";

$ranges = [
    'today' => ['2026-05-22', '2026-05-22'],
    'range' => ['2026-05-14', '2026-05-22'],
    'month' => ['2026-05-01', '2026-05-31'],
];

$parser = app(App\Services\Biometric\ZkDeviceWebReportHtmlParser::class);

foreach ($ranges as $label => [$from, $to]) {
    $form = [
        'sdate' => $from,
        'edate' => $to,
        'period' => '0',
    ];

    foreach ($allUids as $uid) {
        $form['uid'][] = $uid;
    }

    $body = (string) $client->post($base.'/csl/report?action=run', ['form_params' => $form])->getBody();
    $rows = preg_match_all('/<tr/i', $body);
    $punches = $parser->parse($body, $device->timezone);
    echo "{$label} ({$from}..{$to}): tr={$rows} punches=".count($punches)."\n";

    if (count($punches) > 0) {
        file_put_contents(__DIR__.'/zk-probe-output/report-with-uids-'.$label.'.html', $body);
        echo '  sample: '.$punches[0]->deviceUserId.' '.$punches[0]->punchedAt->toIso8601String()."\n";
    }
}

// uid 55 internal - find checkbox for ID Number 55
if (preg_match('/value=(\d+)[^>]+>.*?<td[^>]*>55</td>/is', $index, $pinMatch)) {
    echo 'uid for pin 55: '.$pinMatch[1]."\n";
}
