<?php

$host = '192.168.1.44';
$port = 80;
$fp = fsockopen($host, $port, $errno, $errstr, 15);

if (! is_resource($fp)) {
    exit(1);
}

fwrite($fp, "GET / HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
$raw = stream_get_contents($fp);
fclose($fp);

echo 'raw len='.strlen($raw)."\n";
echo $raw."\n";

if (preg_match('/Set-Cookie:\s*([^\r\n]+)/i', $raw, $m)) {
    echo 'FOUND COOKIE: '.$m[1]."\n";
}
