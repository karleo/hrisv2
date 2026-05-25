<?php

$base = 'http://192.168.1.44';
$jar = tempnam(sys_get_temp_dir(), 'zk');
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_COOKIEJAR => $jar,
    CURLOPT_COOKIEFILE => $jar,
    CURLOPT_HEADER => true,
]);

function req($ch, string $url, ?array $post = null): array
{
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, $post !== null);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post ? http_build_query($post) : '');

    $raw = (string) curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($raw, 0, $headerSize);
    $body = substr($raw, $headerSize);

    return [$code, strlen($body), $body, $headers];
}

$paths = ['/', '/csl/', '/csl/login', '/csl/login.php', '/csl/report', '/csl/report?action=run'];

foreach ($paths as $path) {
    [$code, $len, $body] = req($ch, $base.$path);
    echo "GET {$path} => {$code} len={$len}\n";
    if ($len < 1200 && $len > 0) {
        echo '  '.str_replace("\n", ' ', substr(strip_tags($body), 0, 200))."\n";
    }
}

$creds = [
    ['loginname' => 'administrator', 'loginpwd' => ''],
    ['LoginName' => 'administrator', 'LoginPwd' => ''],
    ['user' => 'administrator', 'password' => ''],
];

foreach ($creds as $i => $fields) {
    [$code, $len, $body] = req($ch, $base.'/csl/login', $fields);
    echo "POST /csl/login set{$i} => {$code} len={$len}\n";
    [$code2, $len2, $body2] = req($ch, $base.'/csl/report?action=run');
    echo "  report => {$code2} len={$len2} table=".(str_contains($body2, '<table') ? 'yes' : 'no')."\n";
    if (str_contains($body2, '<table')) {
        file_put_contents(__DIR__.'/probe-report-sample.html', $body2);
        echo "  saved sample\n";
        break;
    }
}

curl_close($ch);
@unlink($jar);
