<?php

namespace App\Support;

final class BiometricTimezoneOptions
{
    /** IANA timezone for Gulf Standard Time (UTC+4, no DST). */
    public const string Default = 'Asia/Dubai';

    public static function label(string $timezone): string
    {
        return match ($timezone) {
            self::Default => 'Asia/Dubai (UTC+4)',
            'Asia/Muscat' => 'Asia/Muscat (UTC+4)',
            default => $timezone,
        };
    }

    /**
     * Common IANA timezones for device configuration (not the full PHP list).
     *
     * @return list<string>
     */
    public static function common(): array
    {
        return [
            self::Default,
            'UTC',
            'Asia/Riyadh',
            'Asia/Kuwait',
            'Asia/Qatar',
            'Asia/Bahrain',
            'Asia/Muscat',
            'Asia/Karachi',
            'Asia/Kolkata',
            'Asia/Dhaka',
            'Asia/Singapore',
            'Asia/Kuala_Lumpur',
            'Asia/Bangkok',
            'Asia/Jakarta',
            'Asia/Manila',
            'Asia/Hong_Kong',
            'Asia/Shanghai',
            'Asia/Tokyo',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'America/New_York',
            'America/Chicago',
            'America/Los_Angeles',
        ];
    }
}
