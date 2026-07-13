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

    /**
     * Host/IP only — some ADMS menus want this with a separate Port field.
     */
    public static function hostForDeviceMenu(): string
    {
        $host = parse_url(self::baseUrl(), PHP_URL_HOST);

        return is_string($host) && $host !== '' ? $host : self::baseUrl();
    }

    public static function portForDeviceMenu(): int
    {
        $port = parse_url(self::baseUrl(), PHP_URL_PORT);

        if (is_int($port)) {
            return $port;
        }

        $scheme = parse_url(self::baseUrl(), PHP_URL_SCHEME);

        return $scheme === 'http' ? 80 : 443;
    }

    public static function usesHttps(): bool
    {
        return str_starts_with(strtolower(self::baseUrl()), 'https://');
    }

    public static function usesLocalhost(): bool
    {
        $base = self::baseUrl();

        return str_contains($base, 'localhost')
            || str_contains($base, '127.0.0.1');
    }
}
