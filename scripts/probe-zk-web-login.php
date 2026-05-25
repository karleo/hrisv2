<?php

$base = 'http://192.168.1.44';
$jar = tempnam(sys_get_temp_dir(), 'zk');

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_COOKIEJAR => $jar,
    CURLOPT_COOKIEFILE => $jar,
]);

function req($ch, string $url, ?string $post = null): string
{
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, $post !== null);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post ?? '');

    return (string) curl_exec($ch);
}

$attempts = [
    ['user' => 'administrator', 'pass' => ''],
    ['user' => 'admin', 'pass' => ''],
    ['user' => 'admin', 'pass' => 'admin'],
];

foreach ($attempts as $cred) {
    req($ch, $base.'/form/Login', http_build_query([
        'username' => $cred['user'],
        'password' => $cred['pass'],
    ]));
    $body = req($ch, $base.'/csl/report?action=run');
    echo $cred['user'].'/'.$cred['pass'].' len='.strlen($body).' table='.(str_contains($body, '<table') ? 'yes' : 'no')."\n";

    if (str_contains($body, '<table') || str_contains($body, 'ID Number')) {
        file_put_contents(__DIR__.'/probe-report-sample.html', $body);
        echo "saved\n";
        break;
    }
}

curl_close($ch);
@unlink($jar);
