<?php

namespace App\Support;

final class BiometricPushUrl
{
    public static function baseUrl(): string
    {
        $configured = config('biometric.push_base_url');

        if (is_string($configured) && $configured !== '') {
            return rtrim($configured, '/');
        }

        return rtrim((string) config('app.url'), '/');
    }

    public static function cdataEndpoint(): string
    {
        return self::baseUrl().'/iclock/cdata';
    }

    public static function usesLocalhost(): bool
    {
        $base = self::baseUrl();

        return str_contains($base, 'localhost')
            || str_contains($base, '127.0.0.1');
    }
}
