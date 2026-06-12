<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$jar = new GuzzleHttp\Cookie\CookieJar;

$client = new GuzzleHttp\Client([
    'timeout' => 20,
    'cookies' => $jar,
    'allow_redirects' => true,
    'headers' => ['User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'],
]);

$dumpCookies = function (string $label) use ($jar): void {
    $cookies = $jar->toArray();
    echo "{$label}: ".count($cookies)." cookie(s)\n";
    foreach ($cookies as $c) {
        echo '  '.$c['Name'].'='.$c['Value'].' domain='.$c['Domain'].' path='.$c['Path']."\n";
    }
};

$client->get($base.'/');
$dumpCookies('after root');

$client->get($base.'/csl/login');
$dumpCookies('after login page');

$check = $client->post($base.'/csl/check', [
    'form_params' => [
        'username' => $device->deviceWebUsername(),
        'userpwd' => $device->deviceWebPassword(),
    ],
]);
$checkBody = (string) $check->getBody();
echo 'check len='.strlen($checkBody).' redirect='.(str_contains($checkBody, "location.href='/'") ? 'y' : 'n')."\n";
$dumpCookies('after check');

$home = $client->get($base.'/');
$homeBody = (string) $home->getBody();
echo 'home len='.strlen($homeBody).' frameset='.(str_contains(strtolower($homeBody), 'frameset') ? 'y' : 'n')."\n";
$dumpCookies('after home');

$report = $client->get($base.'/csl/report');
$reportBody = (string) $report->getBody();
echo 'report len='.strlen($reportBody).' idn='.(stripos($reportBody, 'id number') !== false ? 'y' : 'n')."\n";

if (strlen($reportBody) > 500) {
    file_put_contents(__DIR__.'/zk-probe-output/cookie-report.html', $reportBody);
}
