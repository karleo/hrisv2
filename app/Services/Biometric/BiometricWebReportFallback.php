<?php

namespace App\Services\Biometric;

use App\Models\BiometricDevice;
use Illuminate\Support\Carbon;
use Throwable;

final class BiometricWebReportFallback
{
    public function __construct(
        private readonly ZkDeviceWebReportClient $webReportClient,
    ) {}

    /**
     * @return array{0: list<BiometricPunchData>, 1: ?string}
     */
    public function fetchPunches(BiometricDevice $device, Carbon $from, Carbon $until): array
    {
        if ($device->host === null || trim($device->host) === '') {
            return [[], 'Device host IP is not set.'];
        }

        try {
            return [$this->webReportClient->fetchPunches($device, $from, $until), null];
        } catch (Throwable $exception) {
            return [[], $exception->getMessage()];
        }
    }
}
