<?php

return [
    'device' => [
        'host' => env('RELAY_DEVICE_HOST'),
        'serial_number' => env('RELAY_DEVICE_SERIAL'),
        'timezone' => env('RELAY_DEVICE_TIMEZONE', 'Asia/Dubai'),
        'port' => (int) env('RELAY_DEVICE_PORT', 80),
        'username' => env('RELAY_DEVICE_WEB_USERNAME', 'administrator'),
        'password' => env('RELAY_DEVICE_WEB_PASSWORD', ''),
        'web_session_id' => env('RELAY_DEVICE_WEB_SESSION_ID'),
        'timeout' => (int) env('RELAY_DEVICE_TIMEOUT', 30),
    ],

    'cdata_url' => env('RELAY_CDATA_URL', 'http://hris-stag.primelogistics.ae/iclock/cdata'),
    'health_url' => env('RELAY_HEALTH_URL', 'http://hris-stag.primelogistics.ae/api/biometric/relay/health'),
    'heartbeat_url' => env('RELAY_HEARTBEAT_URL', 'http://hris-stag.primelogistics.ae/api/biometric/relay/heartbeat'),
    'token' => env('RELAY_TOKEN', ''),
    'chunk_size' => (int) env('RELAY_CHUNK_SIZE', 200),
    'bootstrap_days' => (int) env('RELAY_BOOTSTRAP_DAYS', 7),

    'state_path' => storage_path('relay/state.json'),
    'pending_path' => storage_path('relay/pending.json'),
];
