<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StorageSetting extends Model
{
    public const DRIVER_LOCAL = 'local';

    public const DRIVER_S3 = 's3';

    protected $fillable = [
        'driver',
        'aws_access_key_id',
        'aws_secret_access_key',
        'aws_default_region',
        'aws_bucket',
        'aws_url',
        'aws_use_path_style_endpoint',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'aws_secret_access_key' => 'encrypted',
            'aws_use_path_style_endpoint' => 'boolean',
        ];
    }

    public static function singleton(): ?self
    {
        return static::query()->first();
    }

    public static function singletonOrCreate(array $defaults = []): self
    {
        return static::query()->firstOrCreate(['id' => 1], $defaults);
    }

    public function hasStoredSecret(): bool
    {
        return is_string($this->getRawOriginal('aws_secret_access_key'))
            && $this->getRawOriginal('aws_secret_access_key') !== '';
    }

    public function usesS3(): bool
    {
        return $this->driver === self::DRIVER_S3;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
