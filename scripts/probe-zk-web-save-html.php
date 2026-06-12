<?php

$base = 'http://192.168.1.44';
$jar = tempnam(sys_get_temp_dir(), 'zk');
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 25,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_COOKIEJAR => $jar,
    CURLOPT_COOKIEFILE => $jar,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
]);

function fetch($ch, string $url, ?array $post = null): string
{
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, $post !== null);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post ? http_build_query($post) : '');

    return (string) curl_exec($ch);
}

fetch($ch, $base.'/');
fetch($ch, $base.'/csl/login');

foreach ([['administrator', ''], ['admin', ''], ['administrator', 'admin']] as [$u, $p]) {
    $check = fetch($ch, $base.'/csl/check', ['username' => $u, 'userpwd' => $p]);
    $isLogin = str_contains($check, 'name=myform');
    $isFrame = str_contains(strtolower($check), 'frameset');
    echo "check {$u}/{$p} len=".strlen($check).' login_page='.($isLogin ? 'yes' : 'no').' frameset='.($isFrame ? 'yes' : 'no')."\n";

    if (! $isLogin) {
        file_put_contents(__DIR__.'/zk-probe-output/check-response.html', $check);
        $report = fetch($ch, $base.'/csl/report?action=run');
        file_put_contents(__DIR__.'/zk-probe-output/report.html', $report);
        echo '  check preview: '.substr(strip_tags($check), 0, 120)."\n";
        echo '  report len='.strlen($report).' table='.(str_contains($report, 'ID Number') ? 'yes' : 'no')."\n";
        if (str_contains($report, 'ID Number') || (str_contains($report, '<table') && str_contains($report, '>IN<'))) {
            file_put_contents(__DIR__.'/probe-report-sample.html', $report);
            echo "  SUCCESS\n";
            break;
        }
    }
}

curl_close($ch);
@unlink($jar);
