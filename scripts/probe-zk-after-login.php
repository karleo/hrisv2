<?php

$base = 'http://192.168.1.44';
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$device = App\Models\BiometricDevice::query()->find(12);
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$jar = tempnam(sys_get_temp_dir(), 'zk');
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 25,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_COOKIEJAR => $jar,
    CURLOPT_COOKIEFILE => $jar,
]);

function go($ch, string $url, ?array $post = null): string
{
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPGET, $post === null);
    curl_setopt($ch, CURLOPT_POST, $post !== null);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post ? http_build_query($post) : '');

    return (string) curl_exec($ch);
}

go($ch, $base.'/');
go($ch, $base.'/csl/login');
$check = go($ch, $base.'/csl/check', ['username' => $user, 'userpwd' => $pass]);
file_put_contents(__DIR__.'/zk-probe-output/after-check.html', $check);
echo 'check len='.strlen($check).' frameset='.(str_contains($check, 'frameset') ? 'y' : 'n')."\n";

$paths = [
    '/',
    '/csl/report',
    '/csl/report?action=run',
    '/csl/report?action=run&sdate=2026-05-14&edate=2026-05-22',
    '/csl/attendance',
    '/csl/attlog',
];

foreach ($paths as $path) {
    $body = go($ch, $base.$path);
    $len = strlen($body);
    $table = str_contains($body, '<table') ? 'y' : 'n';
    $idn = stripos($body, 'id number') !== false ? 'y' : 'n';
    $redirect = str_contains($body, 'location.href') ? 'y' : 'n';
    echo "{$path} len={$len} table={$table} idn={$idn} redirect={$redirect}\n";
    if ($idn === 'y' || ($table === 'y' && $len > 500)) {
        file_put_contents(__DIR__.'/zk-probe-output/report-hit.html', $body);
    }
}

$post = go($ch, $base.'/csl/report', [
    'action' => 'run',
    'sdate' => '2026-05-14',
    'edate' => '2026-05-22',
    'StartDate' => '2026-05-14',
    'EndDate' => '2026-05-22',
]);
file_put_contents(__DIR__.'/zk-probe-output/report-post.html', $post);
echo 'POST report len='.strlen($post).' idn='.(stripos($post, 'id number') !== false ? 'y' : 'n')."\n";

curl_close($ch);
@unlink($jar);
