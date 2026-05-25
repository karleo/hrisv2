<?php

namespace App\Console\Commands;

use App\Enums\BiometricConnectionType;
use App\Enums\BiometricSyncType;
use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricSyncPipeline;
use Illuminate\Console\Command;

class PullBiometricDeviceWebReportCommand extends Command
{
    protected $signature = 'biometric:pull-device-web
                            {device : Biometric device ID}
                            {--from= : Start date (Y-m-d) in device timezone}
                            {--to= : End date (Y-m-d) in device timezone}
                            {--force-no-session : Skip SessionID pre-fetch on GET /}';

    protected $description = 'Pull attendance from the iClock web UI on the device IP and import into HRIS';

    public function handle(BiometricSyncPipeline $pipeline): int
    {
        $device = BiometricDevice::query()->find($this->argument('device'));

        if ($device === null) {
            $this->error('Device not found.');

            return self::FAILURE;
        }

        if ($device->connection_type !== BiometricConnectionType::DeviceWebReport) {
            $this->warn('Device is not set to device_web_report. Switching for this run only is not supported — run scripts/switch-biometric-device-web-report.php first.');

            return self::FAILURE;
        }

        $from = $this->option('from');
        $to = $this->option('to');

        if (! is_string($from) || $from === '' || ! is_string($to) || $to === '') {
            $this->error('Both --from and --to are required (e.g. --from=2024-05-21 --to=2024-05-22).');

            return self::FAILURE;
        }

        [$fromCarbon, $untilCarbon] = $pipeline->parsePullRange($device, $from, $to);

        $this->info("Pulling web report for {$device->name} ({$device->host}) from {$from} to {$to}…");

        if ($this->option('force-no-session')) {
            app(\App\Services\Biometric\ZkDeviceWebReportClient::class)->useForceNoSession(true);
        }

        $log = $pipeline->run(
            $device,
            BiometricSyncType::Manual,
            null,
            $fromCarbon,
            $untilCarbon,
        );

        $this->line('Status: '.$log->status->value);
        $this->line('Fetched: '.(string) $log->fetched_count);
        $this->line('Inserted: '.(string) $log->inserted_count);

        if ($log->error_message !== null) {
            $this->warn($log->error_message);
        }

        return $log->status->value === 'completed' ? self::SUCCESS : self::FAILURE;
    }
}
