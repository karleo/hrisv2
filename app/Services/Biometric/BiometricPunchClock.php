<?php

namespace App\Services\Biometric;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

/**
 * Device punch times are stored exactly as shown on the terminal (wall-clock strings).
 * Hosting server timezone and APP_TIMEZONE must not change stored or displayed values.
 */
final class BiometricPunchClock
{
    public static function normalizeWallClock(string $date, string $time): string
    {
        $date = str_replace('/', '-', trim($date));
        $time = trim($time);

        if ($time === '') {
            return $date;
        }

        if (preg_match('/^\d{1,2}:\d{2}$/', $time) === 1) {
            $time .= ':00';
        }

        return trim($date.' '.$time);
    }

    public static function normalizeTimestamp(string $value): string
    {
        $value = trim(str_replace('/', '-', $value));

        if ($value === '') {
            return $value;
        }

        if (preg_match('/^\d{1,2}:\d{2}(:\d{2})?$/', $value) === 1) {
            return self::normalizeWallClock(Carbon::now()->format('Y-m-d'), $value);
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}[ T]\d{1,2}:\d{2}(:\d{2})?$/', $value) === 1) {
            $value = str_replace('T', ' ', $value);

            if (substr_count($value, ':') === 1) {
                $value .= ':00';
            }

            return $value;
        }

        return $value;
    }

    /**
     * @deprecated Use normalizeWallClock / normalizeTimestamp for storage. Kept for ADMS/TCP paths that already have a full timestamp string.
     */
    public static function storageFromDeviceTimestamp(string $timestamp, string $timezone): string
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/', trim($timestamp)) === 1) {
            return self::normalizeTimestamp($timestamp);
        }

        return self::normalizeWallClock(
            Carbon::now($timezone)->format('Y-m-d'),
            $timestamp,
        );
    }

    public static function comparisonCarbon(string $storage, string $timezone): Carbon
    {
        return Carbon::createFromFormat('Y-m-d H:i:s', $storage, $timezone);
    }

    public static function isBefore(string $storage, string $bound): bool
    {
        return $storage < $bound;
    }

    public static function isAfter(string $storage, string $bound): bool
    {
        return $storage > $bound;
    }

    public static function wallClockFromCarbon(CarbonInterface $punchedAt): string
    {
        return $punchedAt->format('Y-m-d H:i:s');
    }
}
