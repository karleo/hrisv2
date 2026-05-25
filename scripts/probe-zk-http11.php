<?php

$host = '192.168.1.44';

$fp = fsockopen($host, 80, $errno, $errstr, 10);
fwrite($fp, "GET / HTTP/1.1\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
$raw = stream_get_contents($fp);
fclose($fp);

echo 'len='.strlen($raw)."\n";
preg_match('/SessionID=([^;\s]+)/i', $raw, $m);
echo 'cookie='.($m[1] ?? 'none')."\n";
echo substr($raw, 0, 500)."\n";
