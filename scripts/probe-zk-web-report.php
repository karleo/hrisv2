<?php

require __DIR__.'/../vendor/autoload.php';

$urls = [
    'http://192.168.1.44/csl/report?action=run',
    'http://192.168.1.44/csl/report',
    'http://192.168.1.44/',
];

foreach ($urls as $url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "{$code} ".strlen((string) $body)." {$url}\n";

    if (is_string($body) && (str_contains($body, '<table') || str_contains($body, 'IN'))) {
        file_put_contents(__DIR__.'/probe-report-sample.html', $body);
        echo "  saved sample html\n";
    }
}
