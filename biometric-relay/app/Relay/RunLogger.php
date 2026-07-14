<?php

namespace BiometricRelay\Relay;

final class RunLogger
{
    public function __construct(
        private readonly ?string $logPath = null,
    ) {}

    /**
     * @param  array<string, mixed>  $context
     */
    public function info(string $message, array $context = []): void
    {
        $this->write('INFO', $message, $context);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public function error(string $message, array $context = []): void
    {
        $this->write('ERROR', $message, $context);
    }

    /**
     * @param  array{
     *     started_at: string,
     *     duration_ms: int,
     *     punches_pulled: int,
     *     punches_relayed: int,
     *     upload_duration_ms: int,
     *     failures: int,
     *     retry_count: int,
     *     status: string,
     *     errors?: list<string>
     * }  $summary
     */
    public function runSummary(array $summary): void
    {
        $this->info('relay_run', $summary);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function write(string $level, string $message, array $context): void
    {
        $line = sprintf(
            "[%s] %s %s %s\n",
            date('c'),
            $level,
            $message,
            json_encode($context, JSON_UNESCAPED_SLASHES) ?: '{}',
        );

        $logPath = $this->logPath;

        if ($logPath === null) {
            if (function_exists('storage_path')) {
                $logPath = storage_path('logs/relay.log');
            } else {
                $logPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'biometric-relay.log';
            }
        }

        if (! is_dir(dirname($logPath))) {
            mkdir(dirname($logPath), 0775, true);
        }

        file_put_contents($logPath, $line, FILE_APPEND);
    }
}
