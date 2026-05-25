<?php

$host = '192.168.1.44';

foreach (['/', '/csl/login', '/csl/report'] as $path) {
    $fp = fsockopen($host, 80, $errno, $errstr, 10);
    fwrite($fp, "GET {$path} HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
    $raw = stream_get_contents($fp);
    fclose($fp);
    preg_match('/SessionID=([^;\s]+)/i', $raw, $m);
    echo $path.' len='.strlen($raw).' cookie='.($m[1] ?? 'none')."\n";
}
