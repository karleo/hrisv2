<?php

$host = '192.168.1.44';

$get = function (?string $cookie = null, string $path = '/') use ($host): array {
    $fp = fsockopen($host, 80, $errno, $errstr, 10);
    $headers = "Host: {$host}\r\nConnection: close\r\n";
    if ($cookie !== null) {
        $headers .= "Cookie: {$cookie}\r\n";
    }
    fwrite($fp, "GET {$path} HTTP/1.0\r\n{$headers}\r\n");
    $raw = stream_get_contents($fp);
    fclose($fp);
    preg_match('/SessionID=([^;\s]+)/i', $raw, $m);
    $redirect = str_contains($raw, '/csl/login') ? 'login' : (str_contains($raw, "location.href='/'") ? 'root' : 'other');

    return ['len' => strlen($raw), 'cookie' => $m[1] ?? null, 'redirect' => $redirect];
};

echo 'plain /: '.json_encode($get())."\n";
echo 'invalid sid: '.json_encode($get('SessionID=1'))."\n";
echo 'expired sid: '.json_encode($get('SessionID=1000000000'))."\n";
echo 'future sid: '.json_encode($get('SessionID='.time()))."\n";

// Burst requests
for ($i = 0; $i < 5; $i++) {
    $r = $get();
    echo "burst {$i}: ".json_encode($r)."\n";
    if ($r['cookie']) {
        break;
    }
    usleep(500000);
}
