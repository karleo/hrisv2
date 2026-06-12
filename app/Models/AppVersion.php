<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppVersion extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'version',
        'description',
        'released_at',
    ];

    protected function casts(): array
    {
        return [
            'released_at' => 'datetime',
        ];
    }

    public static function current(): ?self
    {
        return static::query()
            ->orderByDesc('released_at')
            ->orderByDesc('id')
            ->first();
    }

    public static function currentVersion(): string
    {
        return static::current()?->version ?? '1.12';
    }
}
