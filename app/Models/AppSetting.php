<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    public static function getBool(string $key, bool $default = true): bool
    {
        $raw = static::query()->where('key', $key)->value('value');
        if ($raw === null || $raw === '') {
            return $default;
        }

        if ($raw === '1' || $raw === 1 || $raw === true || $raw === 'true') {
            return true;
        }

        if ($raw === '0' || $raw === 0 || $raw === false || $raw === 'false') {
            return false;
        }

        return $default;
    }

    public static function putBool(string $key, bool $value): void
    {
        static::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $value ? '1' : '0'],
        );
    }
}
