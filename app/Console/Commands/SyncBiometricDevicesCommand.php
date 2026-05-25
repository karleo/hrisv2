<?php

namespace App\Console\Commands;

use App\Enums\BiometricSyncType;
use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricSyncPipeline;
use Illuminate\Console\Command;

class SyncBiometricDevicesCommand extends Command
{
    protected $signature = 'biometric:sync {device? : Device ID to sync} {--sync : Run synchronously instead of queueing}';

    protected $description = 'Sync attendance logs from biometric devices';

    public function handle(BiometricSyncPipeline $pipeline): int
    {
        $deviceId = $this->argument('device');

        $devices = $deviceId !== null
            ? BiometricDevice::query()->whereKey($deviceId)->get()
            : BiometricDevice::query()->where('is_active', true)->get();

        if ($devices->isEmpty()) {
            $this->warn('No devices to sync.');

            return self::SUCCESS;
        }

        foreach ($devices as $device) {
            $log = $pipeline->run($device, BiometricSyncType::Scheduled);
            $this->info("Device {$device->id}: {$log->status->value} (fetched: {$log->fetched_count})");
        }

        return self::SUCCESS;
    }
}
