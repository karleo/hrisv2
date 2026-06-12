<?php

namespace App\Services\Biometric;

use App\Enums\BiometricConnectionType;
use App\Enums\BiometricSyncType;
use App\Models\BiometricDevice;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

final class BiometricBackgroundSyncStarter
{
    public function start(
        int $deviceId,
        ?int $triggeredBy = null,
        ?string $from = null,
        ?string $to = null,
        ?int $syncLogId = null,
    ): void {
        $runner = function () use ($deviceId, $triggeredBy, $from, $to, $syncLogId): void {
            $this->runSync($deviceId, $triggeredBy, $from, $to, $syncLogId);
        };

        $device = BiometricDevice::query()->find($deviceId);

        // ADMS import only processes DB punches (fast). Laragon often never runs detached CLI jobs.
        if (in_array($device?->connection_type, [
            BiometricConnectionType::AdmsPush,
            BiometricConnectionType::DeviceWebReport,
        ], true)) {
            $runner();

            return;
        }

        if (config('biometric.sync_inline')) {
            $runner();

            return;
        }

        if ($this->resolvedSyncDriver() === 'process') {
            $this->startCliProcess($deviceId, $triggeredBy, $from, $to, $syncLogId);

            return;
        }

        dispatch($runner)->afterResponse();
    }

    private function resolvedSyncDriver(): string
    {
        $driver = (string) config('biometric.sync_driver', 'auto');

        if ($driver !== 'auto') {
            return $driver;
        }

        // Laragon mod_php: afterResponse still blocks the HTTP response until sync finishes,
        // so the UI stays on "Starting sync…". Use a detached CLI process instead.
        return function_exists('fastcgi_finish_request') ? 'after_response' : 'process';
    }

    private function runSync(
        int $deviceId,
        ?int $triggeredBy,
        ?string $from,
        ?string $to,
        ?int $syncLogId,
    ): void {
        if (function_exists('set_time_limit')) {
            set_time_limit(600);
        }

        $device = BiometricDevice::query()->findOrFail($deviceId);
        $pipeline = app(BiometricSyncPipeline::class);
        [$fromCarbon, $untilCarbon] = $pipeline->parsePullRange($device, $from, $to);

        $pipeline->run($device, BiometricSyncType::Manual, $triggeredBy, $fromCarbon, $untilCarbon, $syncLogId);
    }

    /**
     * @return list<string>
     */
    private function cliCommand(
        int $deviceId,
        ?int $triggeredBy,
        ?string $from,
        ?string $to,
        ?int $syncLogId,
    ): array {
        $phpBinary = (string) config('biometric.php_binary', PHP_BINARY);
        $phpIni = (string) (config('biometric.php_ini') ?? php_ini_loaded_file() ?? '');

        $command = [$phpBinary];

        if ($phpIni !== '') {
            $command[] = '-c';
            $command[] = $phpIni;
        }

        $command[] = base_path('artisan');
        $command[] = 'biometric:run-device-sync';
        $command[] = (string) $deviceId;

        if ($syncLogId !== null) {
            $command[] = '--log='.$syncLogId;
        }

        if ($triggeredBy !== null) {
            $command[] = '--user='.$triggeredBy;
        }

        if ($from !== null && $from !== '') {
            $command[] = '--from='.$from;
        }

        if ($to !== null && $to !== '') {
            $command[] = '--to='.$to;
        }

        return $command;
    }

    private function startCliProcess(
        int $deviceId,
        ?int $triggeredBy,
        ?string $from,
        ?string $to,
        ?int $syncLogId,
    ): void {
        if (config('biometric.php_ini') === null && function_exists('php_ini_loaded_file')) {
            $ini = php_ini_loaded_file();

            if (is_string($ini) && $ini !== '') {
                config(['biometric.php_ini' => $ini]);
            }
        }

        $process = new Process($this->cliCommand($deviceId, $triggeredBy, $from, $to, $syncLogId), base_path());
        $process->setTimeout(null);
        $process->start(function (string $type, string $buffer): void {
            if (trim($buffer) === '') {
                return;
            }

            Log::channel('single')->info('biometric:run-device-sync '.$type, [
                'output' => trim($buffer),
            ]);
        });
    }
}
