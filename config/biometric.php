<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Run device sync in the same PHP process (tests)
    |--------------------------------------------------------------------------
    |
    | Set true in PHPUnit (phpunit.xml). Do not enable in production .env unless
    | you intentionally want synchronous sync during HTTP requests.
    |
    */

    'sync_inline' => (bool) env('BIOMETRIC_SYNC_INLINE', false),

    /*
    |--------------------------------------------------------------------------
    | Punch timestamps
    |--------------------------------------------------------------------------
    |
    | Imported punch times are stored exactly as the device report shows (wall-clock
    | strings). Server APP_TIMEZONE and hosting region do not change stored values.
    | Set each device's timezone in Biometric → Connectivity for report date ranges only.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | How UI-triggered sync runs after the HTTP response is sent
    |--------------------------------------------------------------------------
    |
    | after_response — same PHP as the web request (PHP-FPM; default for auto on FPM).
    | process          — detached CLI process (default for auto on Laragon mod_php so
    |                   the UI returns immediately; uses Apache php.ini when available).
    |
    */

    'sync_driver' => env('BIOMETRIC_SYNC_DRIVER', 'auto'),

    /*
    |--------------------------------------------------------------------------
    | PHP binary / ini for background CLI sync (Laragon)
    |--------------------------------------------------------------------------
    |
    | When sync_driver=process (default on Laragon Apache), the web request's
    | php.ini is passed to CLI so ext-sockets matches Apache.
    |
    */

    'php_binary' => env('BIOMETRIC_PHP_BINARY', PHP_BINARY),

    'php_ini' => env('BIOMETRIC_PHP_INI'),

    /*
    |--------------------------------------------------------------------------
    | Mark long-running sync logs as failed (minutes)
    |--------------------------------------------------------------------------
    */

    'sync_stale_minutes' => (int) env('BIOMETRIC_SYNC_STALE_MINUTES', 15),

    /*
    |--------------------------------------------------------------------------
    | Extra comm keys to try when opening a ZKTeco session (after saved key + 0)
    |--------------------------------------------------------------------------
    */

    'zkteco_comm_key_fallbacks' => [12345, 54321],

    /*
    |--------------------------------------------------------------------------
    | Public URL for iClock ADMS push (device cannot use localhost)
    |--------------------------------------------------------------------------
    |
    | Example: http://192.168.1.10 (Laragon PC LAN IP, same port as the site)
    |
    */

    'push_base_url' => env('BIOMETRIC_PUSH_BASE_URL'),

    /*
    |--------------------------------------------------------------------------
    | ZKTeco device web report pull (/csl/report on device IP)
    |--------------------------------------------------------------------------
    */

    'skip_employee_mapping_on_import' => (bool) env('BIOMETRIC_SKIP_EMPLOYEE_MAPPING', true),

    'trace' => (bool) env('BIOMETRIC_TRACE', true),

    'log_channel' => env('BIOMETRIC_LOG_CHANNEL'),

    'debug_save_report_html' => (bool) env('BIOMETRIC_DEBUG_SAVE_REPORT_HTML', true),

    'device_web' => [
        'timeout' => (int) env('BIOMETRIC_DEVICE_WEB_TIMEOUT', 30),
        'default_username' => env('BIOMETRIC_DEVICE_WEB_USERNAME', 'administrator'),
        'default_password' => env('BIOMETRIC_DEVICE_WEB_PASSWORD', ''),
        'default_range_days' => (int) env('BIOMETRIC_DEVICE_WEB_RANGE_DAYS', 30),
        'credential_fallbacks' => [
            ['administrator', ''],
            ['admin', ''],
            ['administrator', 'admin'],
        ],
    ],

];
