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

    public function transportMode(): string
    {
        $payload = $this->resolved();

        return (string) ($payload['transport_mode'] ?? 'smtp');
    }

    /**
     * @return array{tenant_id: string, client_id: string, client_secret: string, sender: string}|null
     */
    public function graphConfig(): ?array
    {
        $payload = $this->resolved();
        $graph = $payload['graph'] ?? null;
        if (! is_array($graph)) {
            return null;
        }

        $tenantId = $graph['tenant_id'] ?? null;
        $clientId = $graph['client_id'] ?? null;
        $clientSecret = $graph['client_secret'] ?? null;
        $sender = $graph['sender'] ?? null;
        if (! is_string($tenantId) || $tenantId === '' || ! is_string($clientId) || $clientId === '' || ! is_string($clientSecret) || $clientSecret === '' || ! is_string($sender) || $sender === '') {
            return null;
        }

        return [
            'tenant_id' => $tenantId,
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'sender' => $sender,
        ];
    }

    /**
     * @return array{mail_enabled: bool, workflow_email_enabled: bool, transport_mode: string, source: string, mail: array<string, mixed>, graph: array<string, mixed>|null}
     */
    public function resolved(): array
    {
        return $this->cache->remember(self::CACHE_KEY, self::CACHE_SECONDS, function (): array {
            return $this->resolveUncached();
        });
    }

    /**
     * @param  array<string, mixed>  $override
     * @return array{mail_enabled: bool, workflow_email_enabled: bool, transport_mode: string, source: string, mail: array<string, mixed>, graph: array<string, mixed>|null}
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

        $smtp['scheme'] = match ($normalized['encryption']) {
            'ssl' => 'smtps',
            'tls' => 'smtp',
            default => null,
        };
        if ($normalized['password'] !== null) {
            $smtp['password'] = $normalized['password'];
        }
        $mail['mailers']['smtp'] = $smtp;

        return [
            'mail_enabled' => $normalized['mail_enabled'] ?? $base['mail_enabled'],
            'workflow_email_enabled' => $normalized['workflow_email_enabled'] ?? $base['workflow_email_enabled'],
            'transport_mode' => $normalized['transport_mode'] ?? $base['transport_mode'],
            'source' => 'override',
            'mail' => $mail,
            'graph' => [
                'tenant_id' => $normalized['graph_tenant_id'] ?? ($base['graph']['tenant_id'] ?? null),
                'client_id' => $normalized['graph_client_id'] ?? ($base['graph']['client_id'] ?? null),
                'client_secret' => $normalized['graph_client_secret'] ?? ($base['graph']['client_secret'] ?? null),
                'sender' => $normalized['graph_sender'] ?? ($base['graph']['sender'] ?? null),
            ],
        ];
    }

    /**
     * @param  array{mail_enabled: bool, workflow_email_enabled: bool, transport_mode: string, source: string, mail: array<string, mixed>, graph: array<string, mixed>|null}  $resolved
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
     * @return array{mail_enabled: bool, workflow_email_enabled: bool, transport_mode: string, source: string, mail: array<string, mixed>, graph: array<string, mixed>|null}
     */
    public function applyOverride(array $override): array
    {
        $resolved = $this->resolvedWithOverride($override);
        $this->applyResolved($resolved);

        return $resolved;
    }

    /**
     * @return array{mail_enabled: bool, workflow_email_enabled: bool, transport_mode: string, source: string, mail: array<string, mixed>, graph: array<string, mixed>|null}
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

            $transportMode = (string) ($settings->transport_mode ?: 'smtp');
            if ($transportMode === 'graph') {
                if (! $settings->isValidForGraph()) {
                    $this->logFallback('invalid_db_graph_mail_settings');

                    return $fallback;
                }
            } elseif (! $settings->isValidForSmtp()) {
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
                'transport_mode' => $transportMode,
                'source' => 'database',
                'mail' => [
                    'default' => $mailConfig['default'],
                    'mailers' => [
                        'smtp' => $mailConfig['mailers.smtp'],
                    ],
                    'from' => $mailConfig['from'],
                ],
                'graph' => [
                    'tenant_id' => $settings->graph_tenant_id,
                    'client_id' => $settings->graph_client_id,
                    'client_secret' => $settings->graph_client_secret,
                    'sender' => $settings->graph_sender,
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
     * @return array{mail_enabled: bool, workflow_email_enabled: bool, transport_mode: string, source: string, mail: array<string, mixed>, graph: array<string, mixed>|null}
     */
    private function fallbackPayload(): array
    {
        return [
            'mail_enabled' => true,
            'workflow_email_enabled' => false,
            'transport_mode' => 'smtp',
            'source' => 'env',
            'mail' => [
                'default' => config('mail.default'),
                'mailers' => [
                    'smtp' => config('mail.mailers.smtp'),
                ],
                'from' => config('mail.from'),
            ],
            'graph' => null,
        ];
    }

    /**
     * @param  array<string, mixed>  $override
     * @return array{mail_enabled: bool|null, workflow_email_enabled: bool|null, transport_mode: string|null, graph_tenant_id: string|null, graph_client_id: string|null, graph_client_secret: string|null, graph_sender: string|null, host: string|null, port: int|null, encryption: string|null, username: string|null, password: string|null, timeout: int|null, from_address: string|null, from_name: string|null}
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
            'transport_mode' => isset($override['transport_mode']) && $override['transport_mode'] !== '' ? (string) $override['transport_mode'] : null,
            'graph_tenant_id' => isset($override['graph_tenant_id']) && $override['graph_tenant_id'] !== '' ? (string) $override['graph_tenant_id'] : null,
            'graph_client_id' => isset($override['graph_client_id']) && $override['graph_client_id'] !== '' ? (string) $override['graph_client_id'] : null,
            'graph_client_secret' => isset($override['graph_client_secret']) && $override['graph_client_secret'] !== '' ? (string) $override['graph_client_secret'] : null,
            'graph_sender' => isset($override['graph_sender']) && $override['graph_sender'] !== '' ? (string) $override['graph_sender'] : null,
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
