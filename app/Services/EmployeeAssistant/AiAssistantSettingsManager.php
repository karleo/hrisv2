<?php

namespace App\Services\EmployeeAssistant;

use App\Models\AiAssistantSetting;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

class AiAssistantSettingsManager
{
    private const CACHE_KEY = 'ai_assistant_settings.resolved';

    private const CACHE_SECONDS = 300;

    public function __construct(
        private readonly CacheRepository $cache,
    ) {}

    public function forgetCache(): void
    {
        $this->cache->forget(self::CACHE_KEY);
    }

    public function isEnabled(): bool
    {
        return (bool) ($this->resolved()['enabled'] ?? false);
    }

    public function isConfigured(): bool
    {
        $apiKey = $this->resolved()['openai']['api_key'] ?? null;

        return is_string($apiKey) && trim($apiKey) !== '';
    }

    /**
     * @return array{
     *     enabled: bool,
     *     provider: string,
     *     openai: array{api_key: string, model: string, base_url: string},
     *     max_history: int,
     *     rate_limit: int,
     *     source: string,
     * }
     */
    public function resolved(): array
    {
        return $this->cache->remember(self::CACHE_KEY, self::CACHE_SECONDS, function (): array {
            return $this->resolveUncached();
        });
    }

    /**
     * @param  array<string, mixed>  $override
     * @return array{
     *     enabled: bool,
     *     provider: string,
     *     openai: array{api_key: string, model: string, base_url: string},
     *     max_history: int,
     *     rate_limit: int,
     *     source: string,
     * }
     */
    public function resolvedWithOverride(array $override): array
    {
        $base = $this->resolveUncached();

        $apiKey = $override['api_key'] ?? null;
        if (! is_string($apiKey) || trim($apiKey) === '') {
            $apiKey = $base['openai']['api_key'];
        }

        return [
            'enabled' => array_key_exists('enabled', $override)
                ? (bool) $override['enabled']
                : $base['enabled'],
            'provider' => isset($override['provider']) && is_string($override['provider']) && $override['provider'] !== ''
                ? $override['provider']
                : $base['provider'],
            'openai' => [
                'api_key' => (string) $apiKey,
                'model' => isset($override['model']) && is_string($override['model']) && $override['model'] !== ''
                    ? $override['model']
                    : $base['openai']['model'],
                'base_url' => isset($override['base_url']) && is_string($override['base_url']) && $override['base_url'] !== ''
                    ? rtrim($override['base_url'], '/')
                    : $base['openai']['base_url'],
            ],
            'max_history' => isset($override['max_history'])
                ? max(1, (int) $override['max_history'])
                : $base['max_history'],
            'rate_limit' => isset($override['rate_limit'])
                ? max(1, (int) $override['rate_limit'])
                : $base['rate_limit'],
            'source' => 'override',
        ];
    }

    /**
     * @return array{
     *     enabled: bool,
     *     provider: string,
     *     openai: array{api_key: string, model: string, base_url: string},
     *     max_history: int,
     *     rate_limit: int,
     *     source: string,
     * }
     */
    private function resolveUncached(): array
    {
        $fallback = $this->fallbackPayload();

        try {
            if (! Schema::hasTable('ai_assistant_settings')) {
                return $fallback;
            }

            $settings = AiAssistantSetting::singleton();
            if (! $settings instanceof AiAssistantSetting || ! $settings->isValid()) {
                if ($settings instanceof AiAssistantSetting) {
                    $this->logFallback('invalid_db_ai_assistant_settings');
                }

                return $fallback;
            }

            return [
                ...$settings->toAssistantConfig(),
                'source' => 'database',
            ];
        } catch (Throwable $exception) {
            $this->logFallback('ai_assistant_settings_exception', [
                'message' => $exception->getMessage(),
            ]);

            return $fallback;
        }
    }

    /**
     * @return array{
     *     enabled: bool,
     *     provider: string,
     *     openai: array{api_key: string, model: string, base_url: string},
     *     max_history: int,
     *     rate_limit: int,
     *     source: string,
     * }
     */
    private function fallbackPayload(): array
    {
        return [
            'enabled' => (bool) config('ai-assistant.enabled', true),
            'provider' => (string) config('ai-assistant.provider', 'openai'),
            'openai' => [
                'api_key' => (string) (config('ai-assistant.openai.api_key') ?? ''),
                'model' => (string) config('ai-assistant.openai.model', 'gpt-4o-mini'),
                'base_url' => rtrim((string) config('ai-assistant.openai.base_url', 'https://api.openai.com/v1'), '/'),
            ],
            'max_history' => max(1, (int) config('ai-assistant.max_history', 20)),
            'rate_limit' => max(1, (int) config('ai-assistant.rate_limit', 20)),
            'source' => 'env',
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function logFallback(string $reason, array $context = []): void
    {
        Log::warning('ai_assistant.settings.fallback', [
            'reason' => $reason,
            ...$context,
        ]);
    }
}
