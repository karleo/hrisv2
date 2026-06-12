<?php

namespace App\Support;

class LocaleConfig
{
    /**
     * @return array<int, string>
     */
    public static function supported(): array
    {
        return ['en', 'ar'];
    }

    public static function fallback(): string
    {
        return 'en';
    }

    public static function normalize(?string $locale): string
    {
        $value = strtolower(trim((string) $locale));

        if (in_array($value, self::supported(), true)) {
            return $value;
        }

        return self::fallback();
    }
}
