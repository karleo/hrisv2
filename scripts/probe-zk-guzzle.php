<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);

if ($device === null) {
    fwrite(STDERR, "Device 12 not found\n");
    exit(1);
}

$base = rtrim($device->deviceWebBaseUrl(), '/');
$jar = new GuzzleHttp\Cookie\CookieJar;
$client = new GuzzleHttp\Client([
    'timeout' => 20,
    'cookies' => $jar,
    'allow_redirects' => false,
    'headers' => ['User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'],
]);

$get = function (string $path) use ($client, $base): void {
    $res = $client->get($base.$path);
    $body = (string) $res->getBody();
    $loc = $res->getHeaderLine('Location');
    echo $path.' status='.$res->getStatusCode()
        .' len='.strlen($body)
        .' loc='.$loc
        .' table='.(str_contains($body, '<table') ? 'y' : 'n')
        .' idn='.(stripos($body, 'id number') !== false ? 'y' : 'n')
        ."\n";

    if (strlen($body) > 0 && strlen($body) < 2500) {
        echo '  body: '.str_replace("\n", ' ', substr(strip_tags($body), 0, 200))."\n";
    }

    if (stripos($body, 'id number') !== false || (str_contains($body, '<table') && strlen($body) > 800)) {
        file_put_contents(__DIR__.'/zk-probe-output/guzzle-hit.html', $body);
        echo "  saved guzzle-hit.html\n";
    }
};

$client->get($base.'/');
$client->get($base.'/csl/login');
$check = $client->post($base.'/csl/check', [
    'form_params' => [
        'username' => $device->deviceWebUsername(),
        'userpwd' => $device->deviceWebPassword(),
    ],
]);
echo 'check status='.$check->getStatusCode().' len='.strlen((string) $check->getBody())."\n";

foreach (['/', '/csl/report', '/csl/report?action=run', '/csl/report?action=run&sdate=2026-05-14&edate=2026-05-22'] as $path) {
    $get($path);
}

$post = $client->post($base.'/csl/report', [
    'form_params' => [
        'action' => 'run',
        'sdate' => '2026-05-14',
        'edate' => '2026-05-22',
    ],
]);
$body = (string) $post->getBody();
echo 'POST /csl/report status='.$post->getStatusCode().' len='.strlen($body).' idn='.(stripos($body, 'id number') !== false ? 'y' : 'n')."\n";
