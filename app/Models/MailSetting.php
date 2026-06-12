<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Throwable;

class MailSetting extends Model
{
    protected $fillable = [
        'mail_enabled',
        'workflow_email_enabled',
        'transport_mode',
        'mailer',
        'provider_preset',
        'host',
        'port',
        'encryption',
        'username',
        'password',
        'graph_tenant_id',
        'graph_client_id',
        'graph_client_secret',
        'graph_sender',
        'timeout',
        'from_address',
        'from_name',
        'last_tested_at',
        'last_test_status',
        'last_test_message',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'mail_enabled' => 'boolean',
            'workflow_email_enabled' => 'boolean',
            'graph_client_secret' => 'encrypted',
            'port' => 'integer',
            'timeout' => 'integer',
            'password' => 'encrypted',
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

    public function isValidForSmtp(): bool
    {
        if (! $this->mail_enabled) {
            return true;
        }

        if ($this->mailer !== 'smtp') {
            return false;
        }

        return is_string($this->host)
            && $this->host !== ''
            && is_int($this->port)
            && $this->port > 0
            && is_string($this->from_address)
            && $this->from_address !== '';
    }

    public function isValidForGraph(): bool
    {
        return is_string($this->graph_tenant_id)
            && $this->graph_tenant_id !== ''
            && is_string($this->graph_client_id)
            && $this->graph_client_id !== ''
            && is_string($this->graph_client_secret)
            && $this->graph_client_secret !== ''
            && is_string($this->graph_sender)
            && $this->graph_sender !== '';
    }

    /**
     * @return array<string, mixed>
     */
    public function toMailConfig(): array
    {
        $scheme = match ($this->encryption) {
            'ssl' => 'smtps',
            'tls' => 'smtp',
            default => null,
        };

        return [
            'default' => 'smtp',
            'mailers.smtp' => [
                'transport' => 'smtp',
                'scheme' => $scheme,
                'host' => $this->host,
                'port' => $this->port,
                'username' => $this->username,
                'password' => $this->password,
                'timeout' => $this->timeout,
                'local_domain' => parse_url((string) config('app.url', 'http://localhost'), PHP_URL_HOST),
            ],
            'from' => [
                'address' => $this->from_address,
                'name' => $this->from_name ?: config('app.name'),
            ],
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function hasStoredPassword(): bool
    {
        return $this->getRawOriginal('password') !== null && $this->getRawOriginal('password') !== '';
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
