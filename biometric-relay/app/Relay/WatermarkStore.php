<?php

namespace BiometricRelay\Relay;

use Carbon\Carbon;

final class WatermarkStore
{
    public function __construct(
        private readonly string $path,
    ) {}

    /**
     * @return array{last_successful_punch_at: ?string, last_run_at: ?string, last_run_summary: array<string, mixed>}
     */
    public function read(): array
    {
        if (! is_file($this->path)) {
            return [
                'last_successful_punch_at' => null,
                'last_run_at' => null,
                'last_run_summary' => [],
            ];
        }

        $decoded = json_decode((string) file_get_contents($this->path), true);

        if (! is_array($decoded)) {
            return [
                'last_successful_punch_at' => null,
                'last_run_at' => null,
                'last_run_summary' => [],
            ];
        }

        return [
            'last_successful_punch_at' => isset($decoded['last_successful_punch_at']) && is_string($decoded['last_successful_punch_at'])
                ? $decoded['last_successful_punch_at']
                : null,
            'last_run_at' => isset($decoded['last_run_at']) && is_string($decoded['last_run_at'])
                ? $decoded['last_run_at']
                : null,
            'last_run_summary' => is_array($decoded['last_run_summary'] ?? null) ? $decoded['last_run_summary'] : [],
        ];
    }

    public function watermark(): ?string
    {
        return $this->read()['last_successful_punch_at'];
    }

    /**
     * @param  array<string, mixed>  $summary
     */
    public function write(?string $lastSuccessfulPunchAt, array $summary): void
    {
        $directory = dirname($this->path);

        if (! is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $payload = [
            'last_successful_punch_at' => $lastSuccessfulPunchAt,
            'last_run_at' => Carbon::now()->toIso8601String(),
            'last_run_summary' => $summary,
        ];

        file_put_contents(
            $this->path,
            json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n",
        );
    }
}
