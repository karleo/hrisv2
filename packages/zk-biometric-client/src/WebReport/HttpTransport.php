<?php

namespace PrimeLogistics\ZkBiometricClient\WebReport;

/**
 * Minimal HTTP/1.0 helpers for ZKTeco iClock web UI bodies.
 */
final class HttpTransport
{
    /**
     * ZKTeco devices may concatenate multiple HTTP messages in one Guzzle body.
     *
     * @return list<string>
     */
    public static function bodiesFromPsrBody(string $body): array
    {
        $chunks = preg_split('/(?=HTTP\/1\.[01] )/', $body) ?: [];
        $bodies = [];

        foreach ($chunks as $chunk) {
            $chunk = trim($chunk);

            if ($chunk === '') {
                continue;
            }

            $parts = preg_split('/\r\n\r\n/', $chunk, 2);
            $html = $parts[1] ?? '';

            if ($html !== '') {
                $bodies[] = $html;
            }
        }

        if ($bodies === [] && $body !== '') {
            $bodies[] = $body;
        }

        return $bodies;
    }

    public static function normalizeResponseBody(string $body): string
    {
        $bodies = self::bodiesFromPsrBody($body);

        return $bodies === [] ? $body : $bodies[array_key_last($bodies)];
    }
}
