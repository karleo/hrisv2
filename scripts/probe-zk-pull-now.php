<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$device = App\Models\BiometricDevice::query()->find(12);
$host = trim((string) $device->host);
$fp = fsockopen($host, 80, $errno, $errstr, 10);
fwrite($fp, "GET / HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
$raw = stream_get_contents($fp);
fclose($fp);

if (preg_match('/SessionID=([^;\s]+)/i', $raw, $m) !== 1) {
    echo "No SessionID — close browser tabs to http://{$host} and retry.\n";
    exit(1);
}

$device->update([
    'metadata' => array_merge($device->metadata ?? [], [
        'web_session_id' => $m[1],
        'skip_employee_mapping' => true,
    ]),
]);

echo "Using SessionID={$m[1]}\n";

$log = app(App\Services\Biometric\BiometricSyncPipeline::class)->run(
    $device->fresh(),
    App\Enums\BiometricSyncType::Manual,
    null,
    Illuminate\Support\Carbon::parse('2026-05-14', $device->timezone)->startOfDay()->utc(),
    Illuminate\Support\Carbon::parse('2026-05-22', $device->timezone)->endOfDay()->utc(),
);

echo 'status='.$log->status->value.' fetched='.$log->fetched_count.' inserted='.$log->inserted_count."\n";
echo $log->error_message ?? "ok\n";
