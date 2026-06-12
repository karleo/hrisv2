<?php

$host = '192.168.1.44';
$user = 'administrator';
$pass = file_get_contents(__DIR__.'/../.env');
// skip - use bootstrap
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$d = App\Models\BiometricDevice::find(12);
$user = $d->deviceWebUsername();
$pass = $d->deviceWebPassword();

$rawGet = function (string $path, ?string $cookie = null) use ($host): string {
    $fp = fsockopen($host, 80, $errno, $errstr, 15);
    $headers = "Host: {$host}\r\nConnection: close\r\n";
    if ($cookie) {
        $headers .= "Cookie: SessionID={$cookie}\r\n";
    }
    fwrite($fp, "GET {$path} HTTP/1.0\r\n{$headers}\r\n");
    $raw = stream_get_contents($fp);
    fclose($fp);

    return $raw;
};

$rawPost = function (string $path, array $form, ?string $cookie = null) use ($host): string {
    $body = http_build_query($form);
    $fp = fsockopen($host, 80, $errno, $errstr, 15);
    $headers = "Host: {$host}\r\nConnection: close\r\n";
    $headers .= "Content-Type: application/x-www-form-urlencoded\r\n";
    $headers .= 'Content-Length: '.strlen($body)."\r\n";
    if ($cookie) {
        $headers .= "Cookie: SessionID={$cookie}\r\n";
    }
    fwrite($fp, "POST {$path} HTTP/1.0\r\n{$headers}\r\n{$body}");
    $raw = stream_get_contents($fp);
    fclose($fp);

    return $raw;
};

$root = $rawGet('/');
preg_match('/SessionID=([^;\s]+)/i', $root, $m);
$sid = $m[1] ?? null;
echo 'root cookie='.($sid ?? 'none')."\n";

if ($sid === null) {
    $loginPage = $rawGet('/csl/login');
    preg_match('/SessionID=([^;\s]+)/i', $loginPage, $m2);
    $sid = $m2[1] ?? null;
    echo 'login page cookie='.($sid ?? 'none')."\n";
}

if ($sid === null) {
    echo "cannot continue without session\n";
    exit(1);
}

$rawPost('/csl/check', ['username' => $user, 'userpwd' => $pass], $sid);
$report = $rawGet('/csl/report', $sid);
echo 'report len='.strlen($report).' mainform='.(str_contains($report, 'mainform') ? 'y' : 'n')."\n";
