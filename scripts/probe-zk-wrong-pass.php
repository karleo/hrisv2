<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$client = new GuzzleHttp\Client(['timeout' => 20, 'allow_redirects' => false]);

$try = function (string $user, string $pass) use ($client, $base): void {
    $client->get($base.'/csl/login');
    $res = $client->post($base.'/csl/check', [
        'form_params' => ['username' => $user, 'userpwd' => $pass],
    ]);
    $body = (string) $res->getBody();
    echo "{$user}/".(strlen($pass) ? '***' : '(empty)').' len='.strlen($body)
        .' fail='.(str_contains($body, 'Error Input') ? 'y' : 'n')
        .' login='.(str_contains($body, 'name=myform') ? 'y' : 'n')
        .' redirect='.(str_contains($body, "location.href='/'") ? 'y' : 'n')."\n";
};

$try($device->deviceWebUsername(), 'wrong-password-xyz');
$try($device->deviceWebUsername(), $device->deviceWebPassword());
