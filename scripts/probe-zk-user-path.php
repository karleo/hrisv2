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
echo 'SessionID='.($sessionId !== '' ? 'yes' : 'no')."\n";

$jar = GuzzleHttp\Cookie\CookieJar::fromArray(['SessionID' => $sessionId], $host);
$client = new GuzzleHttp\Client(['timeout' => 20, 'cookies' => $jar]);

$client->get($base.'/csl/login');
$client->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]]);

foreach (['/csl/user', '/csl/User', '/csl/user?first=0&last=20', '/csl/report', '/csl/report?first=0&last=20'] as $path) {
    $html = (string) $client->get($base.$path)->getBody();
    $uidCount = preg_match_all('/name=uid\s+value=(\d+)/i', $html);
    $idCells = preg_match_all('/<td[^>]*width=15%[^>]*>(\d+)<\/td>/i', $html);
    echo $path.' len='.strlen($html).' uids='.$uidCount.' idcells='.$idCells
        .' mainform='.(str_contains($html, 'mainform') ? 'y' : 'n')
        .' redirect='.(str_contains($html, 'location.href') ? 'y' : 'n')."\n";
}
