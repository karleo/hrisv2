<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Str;

class DisallowCommonAndPersonalPassword implements ValidationRule
{
    /**
     * Blocklist: lowercase exact match after normalizing the submitted password.
     *
     * @var list<string>
     */
    private const COMMON_PASSWORDS = [
        'password',
        'password1',
        'password12',
        'password123',
        '12345678',
        '123456789',
        '1234567890',
        'qwerty',
        'qwerty123',
        'abc123',
        'letmein',
        'welcome',
        'welcome1',
        'admin',
        'admin123',
        'monkey',
        'dragon',
        'master',
        'sunshine',
        'princess',
        'football',
        'iloveyou',
        'trustno1',
    ];

    public function __construct(
        private readonly string $fullName,
        private readonly string $email,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            return;
        }

        $lower = mb_strtolower($value);

        if (in_array($lower, self::COMMON_PASSWORDS, true)) {
            $fail('This password is too commonly used. Choose a stronger, unique password.');

            return;
        }

        foreach ($this->nameTokens($this->fullName) as $token) {
            if (str_contains($lower, $token)) {
                $fail('Do not use your name or parts of your name in the password.');

                return;
            }
        }

        $local = mb_strtolower(Str::before($this->email, '@'));
        if ($local !== '' && mb_strlen($local) >= 2 && str_contains($lower, $local)) {
            $fail('Do not use your email or the part before @ in the password.');

            return;
        }
    }

    /**
     * @return list<string>
     */
    private function nameTokens(string $name): array
    {
        $squished = Str::squish($name);
        if ($squished === '') {
            return [];
        }

        $parts = preg_split('/\s+/u', $squished, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $tokens = [];

        foreach ($parts as $part) {
            $t = mb_strtolower($part);
            if (mb_strlen($t) >= 3) {
                $tokens[] = $t;
            }
        }

        $collapsedNoSpace = str_replace(' ', '', mb_strtolower($squished));
        if (mb_strlen($collapsedNoSpace) >= 3) {
            $tokens[] = $collapsedNoSpace;
        }

        return array_values(array_unique($tokens));
    }
}
