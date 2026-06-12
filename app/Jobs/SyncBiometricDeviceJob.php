<?php

namespace App\Jobs;

use App\Enums\BiometricSyncType;
use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricSyncPipeline;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Legacy queued job — scheduled sync uses biometric:sync inline instead.
 */
class SyncBiometricDeviceJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600;

    public function __construct(
        public int $deviceId,
        public BiometricSyncType $syncType = BiometricSyncType::Manual,
        public ?int $triggeredBy = null,
        public ?string $from = null,
        public ?string $until = null,
        public ?int $syncLogId = null,
    ) {}

    public function handle(BiometricSyncPipeline $pipeline): void
    {
        $device = BiometricDevice::query()->findOrFail($this->deviceId);

        [$from, $until] = $pipeline->parsePullRange($device, $this->from, $this->until);

        $pipeline->run($device, $this->syncType, $this->triggeredBy, $from, $until, $this->syncLogId);
    }
}
