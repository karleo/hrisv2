<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Contracts\Database\Eloquent\ComparesCastableAttributes;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class EncryptedString implements CastsAttributes, ComparesCastableAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return $this->decryptValue($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return Crypt::encryptString((string) $value);
    }

    public function compare(Model $model, string $key, mixed $firstValue, mixed $secondValue): bool
    {
        if ($firstValue === $secondValue) {
            return true;
        }

        return $this->decryptValue($firstValue) === $this->decryptValue($secondValue);
    }

    private function decryptValue(mixed $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (DecryptException) {
            return null;
        }
    }
}
