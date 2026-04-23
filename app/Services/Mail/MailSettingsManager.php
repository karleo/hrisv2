<?php

namespace App\Services\Mail;

use App\Models\MailSetting;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class MailSettingsManager
{
    private const CACHE_KEY = 'mail_settings.resolved';

    private const CACHE_SECONDS = 300;

    private ?string $lastAppliedHash = null;

    public function __construct(
        private readonly CacheRepository $cache,
    ) {}

    public function forgetCache(): void
    {
        $this->cache->forget(self::CACHE_KEY);
    }

    public function isMailEnabled(): bool
    {
        $payload = $this->resolved();

        return (bool) ($payload['mail_enabled'] ?? true);
    }

    /**
     * @return array<string, mixed>
     */
    public function resolvedMailConfig(): array
    {
        $payload = $this->resolved();

        return $payload['mail'];
    }

    public function isWorkflowEmailEnabled(): bool
    {
        $payload = $this->resolved();

        return (bool) ($payload['workflow_email_enabled'] ?? false);
    }

    /**
     * @return array{mail_enabled: bool, workflow_email_enabled: bool, source: string, mail: array<string, mixed>}
     */
    public function resolved(): array
    {
        return $this->cache->remember(self::CACHE_KEY, self::CACHE_SECONDS, function (): array {
            return $this->resolveUncached();
        });
    }

    /**
     * @param  array<string, mixed>  $override
     * @return array{mail_enabled: bool, workflow_email_enabled: bool, source: string, mail: array<string, mixed>}
     */
    public function resolvedWithOverride(array $override): array
    {
        $base = $this->resolveUncached();
        $normalized = $this->normalizeOverride($override);

        $mail = $base['mail'];
        $smtp = $mail['mailers']['smtp'];
        if ($normalized['host'] !== null) {
            $smtp['host'] = $normalized['host'];
        }
        if ($normalized['port'] !== null) {
            $smtp['port'] = $normalized['port'];
        }
        if ($normalized['username'] !== null) {
            $smtp['username'] = $normalized['username'];
        }
        if ($normalized['timeout'] !== null) {
            $smtp['timeout'] = $normalized['timeout'];
        }
        if ($normalized['from_address'] !== null) {
            $mail['from']['address'] = $normalized['from_address'];
        }
        if ($normalized['from_name'] !== null) {
            $mail['from']['name'] = $normalized['from_name'];
        }

        $smtp['scheme'] = $normalized['encryption'];
        if ($normalized['password'] !== null) {
            $smtp['password'] = $normalized['password'];
        }
        $mail['mailers']['smtp'] = $smtp;

        return [
            'mail_enabled' => $normalized['mail_enabled'] ?? $base['mail_enabled'],
            'workflow_email_enabled' => $normalized['workflow_email_enabled'] ?? $base['workflow_email_enabled'],
            'source' => 'override',
            'mail' => $mail,
        ];
    }

    /**
     * @param  array{mail_enabled: bool, workflow_email_enabled: bool, source: string, mail: array<string, mixed>}  $resolved
     */
    public function applyResolved(array $resolved): void
    {
        $hash = md5(json_encode($resolved) ?: Str::random(16));
        if ($this->lastAppliedHash === $hash) {
            return;
        }

        config(['mail.default' => $resolved['mail']['default']]);
        config(['mail.mailers.smtp' => $resolved['mail']['mailers']['smtp']]);
        config(['mail.from' => $resolved['mail']['from']]);

        $this->purgeMailManager();

        $this->lastAppliedHash = $hash;
    }

    public function applyLatest(): array
    {
        $resolved = $this->resolved();
        $this->applyResolved($resolved);

        return $resolved;
    }

    /**
     * @param  array<string, mixed>  $override
     * @return array{mail_enabled: bool, workflow_email_enabled: bool, source: string, mail: array<string, mixed>}
     */
    public function applyOverride(array $override): array
    {
        $resolved = $this->resolvedWithOverride($override);
        $this->applyResolved($resolved);

        return $resolved;
    }

    /**
     * @return array{mail_enabled: bool, workflow_email_enabled: bool, source: string, mail: array<string, mixed>}
     */
    private function resolveUncached(): array
    {
        $fallback = $this->fallbackPayload();

        try {
            if (! Schema::hasTable('mail_settings')) {
                return $fallback;
            }

            $settings = MailSetting::singleton();
            if (! $settings instanceof MailSetting) {
                return $fallback;
            }

            if (! $settings->isValidForSmtp()) {
                $this->logFallback('invalid_db_mail_settings');

                return $fallback;
            }

            $mailConfig = $settings->toMailConfig();
            if (! is_array($mailConfig['mailers.smtp'] ?? null) || ! is_array($mailConfig['from'] ?? null)) {
                $this->logFallback('malformed_db_mail_settings');

                return $fallback;
            }

            return [
                'mail_enabled' => (bool) $settings->mail_enabled,
                'workflow_email_enabled' => (bool) $settings->workflow_email_enabled,
                'source' => 'database',
                'mail' => [
                    'default' => $mailConfig['default'],
                    'mailers' => [
                        'smtp' => $mailConfig['mailers.smtp'],
                    ],
                    'from' => $mailConfig['from'],
                ],
            ];
        } catch (Throwable $exception) {
            $this->logFallback('mail_settings_exception', [
                'message' => $exception->getMessage(),
            ]);

            return $fallback;
        }
    }

    /**
     * @return array{mail_enabled: bool, workflow_email_enabled: bool, source: string, mail: array<string, mixed>}
     */
    private function fallbackPayload(): array
    {
        return [
            'mail_enabled' => true,
            'workflow_email_enabled' => false,
            'source' => 'env',
            'mail' => [
                'default' => config('mail.default'),
                'mailers' => [
                    'smtp' => config('mail.mailers.smtp'),
                ],
                'from' => config('mail.from'),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $override
     * @return array{mail_enabled: bool|null, workflow_email_enabled: bool|null, host: string|null, port: int|null, encryption: string|null, username: string|null, password: string|null, timeout: int|null, from_address: string|null, from_name: string|null}
     */
    private function normalizeOverride(array $override): array
    {
        $mailEnabled = array_key_exists('mail_enabled', $override)
            ? (bool) $override['mail_enabled']
            : null;
        $workflowEmailEnabled = array_key_exists('workflow_email_enabled', $override)
            ? (bool) $override['workflow_email_enabled']
            : null;
        $port = isset($override['port']) && $override['port'] !== ''
            ? (int) $override['port']
            : null;
        $timeout = isset($override['timeout']) && $override['timeout'] !== ''
            ? (int) $override['timeout']
            : null;
        $encryption = $override['encryption'] ?? null;
        $encryption = is_string($encryption) && $encryption !== '' ? $encryption : null;

        return [
            'mail_enabled' => $mailEnabled,
            'workflow_email_enabled' => $workflowEmailEnabled,
            'host' => isset($override['host']) && $override['host'] !== '' ? (string) $override['host'] : null,
            'port' => $port,
            'encryption' => $encryption,
            'username' => isset($override['username']) && $override['username'] !== '' ? (string) $override['username'] : null,
            'password' => isset($override['password']) && $override['password'] !== '' ? (string) $override['password'] : null,
            'timeout' => $timeout,
            'from_address' => isset($override['from_address']) && $override['from_address'] !== '' ? (string) $override['from_address'] : null,
            'from_name' => isset($override['from_name']) && $override['from_name'] !== '' ? (string) $override['from_name'] : null,
        ];
    }

    private function purgeMailManager(): void
    {
        $mailManager = app('mail.manager');

        if (method_exists($mailManager, 'purge')) {
            $mailManager->purge();
        }

        if (method_exists($mailManager, 'forgetDrivers')) {
            $mailManager->forgetDrivers();
        }
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function logFallback(string $reason, array $context = []): void
    {
        Log::warning('mail.settings.fallback', [
            'reason' => $reason,
            ...$context,
        ]);
    }
}
