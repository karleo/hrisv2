<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

// Full flow without explicit SessionID
$jar = new GuzzleHttp\Cookie\CookieJar;
$client = new GuzzleHttp\Client(['timeout' => 25, 'cookies' => $jar, 'allow_redirects' => true]);

foreach (['/', '/csl/login'] as $warmup) {
    $client->get($base.$warmup);
    echo 'cookies after '.$warmup.': '.count($jar->toArray())."\n";
}

$client->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]]);
echo 'cookies after check: '.count($jar->toArray())."\n";
foreach ($jar->toArray() as $c) {
    echo '  '.$c['Name'].'='.$c['Value']."\n";
}

$index = (string) $client->get($base.'/csl/report')->getBody();
echo 'index len='.strlen($index).' mainform='.(str_contains($index, 'mainform') ? 'y' : 'n')."\n";

// With allow_redirects true through login
$jar2 = new GuzzleHttp\Cookie\CookieJar;
$client2 = new GuzzleHttp\Client(['timeout' => 25, 'cookies' => $jar2, 'allow_redirects' => true]);
$client2->get($base.'/');
$client2->get($base.'/csl/login');
$client2->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]]);
$client2->get($base.'/');
$index2 = (string) $client2->get($base.'/csl/report')->getBody();
echo 'with home redirect index len='.strlen($index2).' mainform='.(str_contains($index2, 'mainform') ? 'y' : 'n')."\n";
