<?php

namespace App\Services\Biometric;

use Illuminate\Support\Facades\Log;

final class BiometricPipelineTracer
{
    /** @var list<array{line: string, context: array<string, mixed>, at: float}> */
    private array $stages = [];

    public function enabled(): bool
    {
        return (bool) config('biometric.trace', true);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public function log(string $line, array $context = []): void
    {
        if (! $this->enabled()) {
            return;
        }

        $this->stages[] = [
            'line' => $line,
            'context' => $context,
            'at' => microtime(true),
        ];

        $channel = config('biometric.log_channel');

        if (is_string($channel) && $channel !== '') {
            Log::channel($channel)->info($line, $context);
        } else {
            Log::info($line, $context);
        }
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public function stage(string $stage, array $context = []): void
    {
        $context['stage'] = $stage;
        $this->log('BIOMETRIC_STAGE '.$stage, $context);
    }

    /**
     * @return list<array{line: string, context: array<string, mixed>, at: float}>
     */
    public function stages(): array
    {
        return $this->stages;
    }

    public function reset(): void
    {
        $this->stages = [];
    }
}
