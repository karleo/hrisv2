<?php

namespace App\Console\Commands;

use App\Enums\BiometricSyncType;
use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricSyncPipeline;
use Illuminate\Console\Command;

class RunBiometricDeviceSyncCommand extends Command
{
    protected $signature = 'biometric:run-device-sync
                            {device : Biometric device ID}
                            {--user= : User ID who triggered the sync}
                            {--from= : Pull from date (Y-m-d, device timezone)}
                            {--to= : Pull to date (Y-m-d, device timezone)}
                            {--log= : Existing sync log ID created by the UI}';

    protected $description = 'Run a single biometric device sync (used by background pull from the UI)';

    public function handle(BiometricSyncPipeline $pipeline): int
    {
        $device = BiometricDevice::query()->findOrFail($this->argument('device'));

        [$from, $until] = $pipeline->parsePullRange(
            $device,
            $this->option('from'),
            $this->option('to'),
        );

        $userId = $this->option('user');
        $triggeredBy = is_numeric($userId) ? (int) $userId : null;

        $logId = $this->option('log');
        $syncLogId = is_numeric($logId) ? (int) $logId : null;

        $log = $pipeline->run($device, BiometricSyncType::Manual, $triggeredBy, $from, $until, $syncLogId);

        $this->info("Device {$device->id}: {$log->status->value} (fetched: {$log->fetched_count})");

        return $log->status->value === 'failed' ? self::FAILURE : self::SUCCESS;
    }
}
