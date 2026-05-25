<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$host = parse_url($device->deviceWebBaseUrl(), PHP_URL_HOST);
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$post = function (?string $cookie, string $path, array $form) use ($host): string {
    $body = http_build_query($form);
    $fp = fsockopen($host, 80, $errno, $errstr, 15);
    $headers = "Host: {$host}\r\nConnection: close\r\n";
    $headers .= "Content-Type: application/x-www-form-urlencoded\r\n";
    $headers .= 'Content-Length: '.strlen($body)."\r\n";
    if ($cookie) {
        $headers .= "Cookie: {$cookie}\r\n";
    }
    fwrite($fp, "POST {$path} HTTP/1.0\r\n{$headers}\r\n{$body}");
    $raw = stream_get_contents($fp);
    fclose($fp);

    return $raw;
};

$get = function (?string $cookie, string $path) use ($host): string {
    $fp = fsockopen($host, 80, $errno, $errstr, 15);
    $headers = "Host: {$host}\r\nConnection: close\r\n";
    if ($cookie) {
        $headers .= "Cookie: {$cookie}\r\n";
    }
    fwrite($fp, "GET {$path} HTTP/1.0\r\n{$headers}\r\n");
    $raw = stream_get_contents($fp);
    fclose($fp);

    return $raw;
};

$root = $get(null, '/');
preg_match('/SessionID=([^;\s]+)/i', $root, $m);
$sid = $m[1] ?? null;
echo 'GET / cookie='.($sid ?? 'none')."\n";

$cookieHdr = $sid ? "SessionID={$sid}" : null;
$get($cookieHdr, '/csl/login');

$check = $post($cookieHdr, '/csl/check', ['username' => $user, 'userpwd' => $pass]);
preg_match_all('/Set-Cookie:\s*SessionID=([^;\s]+)/i', $check, $cm);
echo 'POST check Set-Cookie count='.count($cm[1] ?? [])."\n";
if (! empty($cm[1])) {
    echo '  new ids: '.implode(',', $cm[1])."\n";
}

$sid2 = $cm[1][0] ?? $sid;
$report = $get($sid2 ? "SessionID={$sid2}" : null, '/csl/report');
echo 'GET report len='.strlen($report).' mainform='.(str_contains($report, 'mainform') ? 'y' : 'n')."\n";

// POST check without prior GET /
$check2 = $post(null, '/csl/check', ['username' => $user, 'userpwd' => $pass]);
preg_match_all('/Set-Cookie:\s*SessionID=([^;\s]+)/i', $check2, $cm2);
echo 'POST check (no prior /) Set-Cookie='.count($cm2[1] ?? [])."\n";
