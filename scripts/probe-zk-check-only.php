<?php

$base = 'http://192.168.1.44';
$jar = tempnam(sys_get_temp_dir(), 'zk');

function client($jar): \CurlHandle
{
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_COOKIEJAR => $jar,
        CURLOPT_COOKIEFILE => $jar,
        CURLOPT_HEADER => true,
    ]);

    return $ch;
}

function request(\CurlHandle $ch, string $url, ?array $post = null): array
{
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPGET, $post === null);
    curl_setopt($ch, CURLOPT_POST, $post !== null);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post ? http_build_query($post) : '');

    $raw = (string) curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);

    return [
        $code,
        substr($raw, 0, $headerSize),
        substr($raw, $headerSize),
    ];
}

$ch = client($jar);
[$c] = request($ch, $base.'/');
echo "GET / => {$c}\n";
[$c] = request($ch, $base.'/csl/login');
echo "GET login => {$c}\n";

foreach ([['administrator', ''], ['admin', ''], ['administrator', '123456']] as [$u, $p]) {
    [$code, $headers, $body] = request($ch, $base.'/csl/check', ['username' => $u, 'userpwd' => $p]);
    echo "\nPOST check {$u}/'{$p}' => HTTP {$code} body=".strlen($body)."\n";
    echo substr($headers, 0, 400)."\n";
    echo substr(strip_tags($body), 0, 200)."\n";

    $ch2 = client($jar);
    [$rc, , $report] = request($ch2, $base.'/csl/report?action=run');
    echo "GET report => {$rc} len=".strlen($report).' hasTable='.(str_contains($report, 'ID Number') ? 'y' : 'n')."\n";
}

curl_close($ch);
@unlink($jar);
