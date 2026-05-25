<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');

$client = new GuzzleHttp\Client([
    'timeout' => 20,
    'allow_redirects' => false,
    'headers' => ['User-Agent' => 'Mozilla/5.0'],
]);

$print = function (string $label, GuzzleHttp\Psr7\Response $res): void {
    echo "=== {$label} status={$res->getStatusCode()} ===\n";
    foreach ($res->getHeaders() as $name => $values) {
        echo $name.': '.implode(', ', $values)."\n";
    }
    $body = (string) $res->getBody();
    echo 'body_len='.strlen($body)."\n";
    if (strlen($body) < 400) {
        echo $body."\n";
    }
    echo "\n";
};

$print('GET /', $client->get($base.'/'));
$print('GET login', $client->get($base.'/csl/login'));
$print('POST check', $client->post($base.'/csl/check', [
    'form_params' => [
        'username' => $device->deviceWebUsername(),
        'userpwd' => $device->deviceWebPassword(),
    ],
]));
