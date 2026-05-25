<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$host = parse_url($base, PHP_URL_HOST);
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$root = (string) (new GuzzleHttp\Client(['timeout' => 20, 'allow_redirects' => false]))
    ->get($base.'/')->getBody();

preg_match('/SessionID=([^;\s]+)/i', implode("\n", (new GuzzleHttp\Client)->get($base.'/')->getHeaders()['Set-Cookie'] ?? []), $m);

// Manual session from raw
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

$forms = [
    ['action' => 'run', 'sdate' => '2026-05-14', 'edate' => '2026-05-22'],
    ['action' => 'run', 'StartDate' => '2026-05-14', 'EndDate' => '2026-05-22'],
    ['action' => 'run', 'from' => '2026-05-14', 'to' => '2026-05-22'],
    ['action' => 'run', 'year' => '2026', 'month' => '05', 'day' => '14', 'year2' => '2026', 'month2' => '05', 'day2' => '22'],
];

foreach ($forms as $i => $form) {
    $body = (string) $client->post($base.'/csl/report', ['form_params' => $form])->getBody();
    $rows = preg_match_all('/<tr/i', $body);
    echo "form{$i} len=".strlen($body).' tr='.$rows.' data_rows='.($rows > 1 ? 'y' : 'n')."\n";

    if ($rows > 2) {
        file_put_contents(__DIR__.'/zk-probe-output/report-with-data.html', $body);
    }
}

// GET report index then POST
$index = (string) $client->get($base.'/csl/report')->getBody();
file_put_contents(__DIR__.'/zk-probe-output/report-index.html', $index);
echo 'index len='.strlen($index)."\n";

if (preg_match_all('/<input[^>]+>/i', $index, $inputs)) {
    foreach ($inputs[0] as $input) {
        echo '  '.$input."\n";
    }
}
