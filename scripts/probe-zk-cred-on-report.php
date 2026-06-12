<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$base = rtrim($device->deviceWebBaseUrl(), '/');
$user = $device->deviceWebUsername();
$pass = $device->deviceWebPassword();

$client = new GuzzleHttp\Client(['timeout' => 20, 'allow_redirects' => true]);

$client->get($base.'/csl/login');
$client->post($base.'/csl/check', ['form_params' => ['username' => $user, 'userpwd' => $pass]]);

$attempts = [
    'get_plain' => ['GET', $base.'/csl/report?action=run', null],
    'get_with_creds' => ['GET', $base.'/csl/report?action=run&username='.rawurlencode($user).'&userpwd='.rawurlencode($pass), null],
    'post_report' => ['POST', $base.'/csl/report', [
        'username' => $user,
        'userpwd' => $pass,
        'action' => 'run',
        'sdate' => '2026-05-14',
        'edate' => '2026-05-22',
        'StartDate' => '2026-05-14',
        'EndDate' => '2026-05-22',
        'from' => '2026-05-14',
        'to' => '2026-05-22',
    ]],
    'post_check_then_report' => ['POST', $base.'/csl/report', [
        'action' => 'run',
        'sdate' => '2026-05-14',
        'edate' => '2026-05-22',
    ]],
];

foreach ($attempts as $label => [$method, $url, $form]) {
    $options = [];

    if ($form !== null) {
        $options['form_params'] = $form;
    }

    $res = $method === 'GET'
        ? $client->get($url, $options)
        : $client->post($url, $options);

    $body = (string) $res->getBody();
    $hasIdn = stripos($body, 'id number') !== false;
    $rows = preg_match_all('/<tr/i', $body, $m);

    echo "{$label}: len=".strlen($body).' idn='.($hasIdn ? 'y' : 'n').' tr='.$rows
        .' redirect='.(str_contains($body, "location.href='/'") ? 'y' : 'n')."\n";

    if ($hasIdn && $rows > 2) {
        file_put_contents(__DIR__.'/zk-probe-output/cred-hit-'.$label.'.html', $body);
    }
}
