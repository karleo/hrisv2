<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$client = new GuzzleHttp\Client(['timeout' => 20, 'allow_redirects' => false]);

$client->get($base.'/csl/login');
$check = (string) $client->post($base.'/csl/check', [
    'form_params' => ['username' => $user, 'userpwd' => $pass],
])->getBody();

echo 'check ok='.(str_contains($check, "location.href='/'") ? 'y' : 'n')."\n";

$index = (string) $client->get($base.'/csl/report')->getBody();
echo 'index len='.strlen($index).' mainform='.(str_contains($index, 'mainform') ? 'y' : 'n')."\n";

// Try with Cookie: SessionID=time()
$host = parse_url($base, PHP_URL_HOST);
$jar = GuzzleHttp\Cookie\CookieJar::fromArray(['SessionID' => (string) time()], $host);
$client2 = new GuzzleHttp\Client(['timeout' => 20, 'cookies' => $jar, 'allow_redirects' => false]);
$client2->get($base.'/csl/login');
$client2->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]]);
$index2 = (string) $client2->get($base.'/csl/report')->getBody();
echo 'with guessed cookie index len='.strlen($index2).' mainform='.(str_contains($index2, 'mainform') ? 'y' : 'n')."\n";
