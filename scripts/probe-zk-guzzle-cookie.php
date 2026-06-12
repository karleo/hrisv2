<?php

require __DIR__.'/../vendor/autoload.php';

$client = new GuzzleHttp\Client(['timeout' => 20, 'allow_redirects' => false, 'http_errors' => false]);
$res = $client->get('http://192.168.1.44/');
echo 'status='.$res->getStatusCode()."\n";
echo 'Set-Cookie headers: '.json_encode($res->getHeader('Set-Cookie'))."\n";
$body = (string) $res->getBody();
echo 'body len='.strlen($body)."\n";
if (preg_match('/SessionID=([^;\s]+)/i', $body, $m)) {
    echo 'SessionID in body: '.$m[1]."\n";
}
