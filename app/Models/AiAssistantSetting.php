<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Throwable;

class AiAssistantSetting extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'enabled',
        'provider',
        'model',
        'api_key',
        'base_url',
        'max_history',
        'rate_limit',
        'last_tested_at',
        'last_test_status',
        'last_test_message',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'api_key' => 'encrypted',
            'max_history' => 'integer',
            'rate_limit' => 'integer',
            'last_tested_at' => 'datetime',
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

    public function isValid(): bool
    {
        return is_string($this->model)
            && trim($this->model) !== ''
            && $this->hasStoredApiKey();
    }

    public function hasStoredApiKey(): bool
    {
        $raw = $this->getRawOriginal('api_key');

        return is_string($raw) && $raw !== '';
    }

    /**
     * @return array{
     *     enabled: bool,
     *     provider: string,
     *     openai: array{api_key: string, model: string, base_url: string},
     *     max_history: int,
     *     rate_limit: int,
     * }
     */
    public function toAssistantConfig(): array
    {
        return [
            'enabled' => (bool) $this->enabled,
            'provider' => (string) ($this->provider ?: 'openai'),
            'openai' => [
                'api_key' => (string) ($this->api_key ?? ''),
                'model' => (string) ($this->model ?: 'gpt-4o-mini'),
                'base_url' => (string) ($this->base_url ?: 'https://api.openai.com/v1'),
            ],
            'max_history' => max(1, (int) ($this->max_history ?: 20)),
            'rate_limit' => max(1, (int) ($this->rate_limit ?: 20)),
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function safeLastTestMessage(): ?string
    {
        if (! is_string($this->last_test_message) || $this->last_test_message === '') {
            return null;
        }

        try {
            return mb_substr($this->last_test_message, 0, 500);
        } catch (Throwable) {
            return null;
        }
    }
}
