<?php

$host = '192.168.1.44';

$get = function (bool $clearFirst) use ($host): ?string {
    if ($clearFirst) {
        foreach (['/csl/logout', '/'] as $path) {
            $fp = fsockopen($host, 80, $errno, $errstr, 10);
            fwrite($fp, "GET {$path} HTTP/1.0\r\nHost: {$host}\r\nCookie: SessionID=0\r\nConnection: close\r\n\r\n");
            stream_get_contents($fp);
            fclose($fp);
            usleep(100000);
        }
    }
    $fp = fsockopen($host, 80, $errno, $errstr, 10);
    fwrite($fp, "GET / HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
    $raw = stream_get_contents($fp);
    fclose($fp);
    preg_match('/SessionID=([^;\s]+)/i', $raw, $m);

    return $m[1] ?? null;
};

echo 'no clear: '.($get(false) ?? 'none')."\n";
echo 'with clear: '.($get(true) ?? 'none')."\n";
