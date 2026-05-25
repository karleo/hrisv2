<?php

namespace App\Services\Biometric\Connectors;

use App\Contracts\Biometric\BiometricDeviceConnector;
use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricPunchData;
use Generator;
use Illuminate\Support\Carbon;

final class FakeBiometricConnector implements BiometricDeviceConnector
{
    /** @var list<BiometricPunchData> */
    private array $punches = [];

    public bool $connectionWorks = true;

    public function setPunches(BiometricPunchData ...$punches): void
    {
        $this->punches = $punches;
    }

    public function testConnection(BiometricDevice $device): bool
    {
        return $this->connectionWorks;
    }

    public function fetchAttendanceLogs(
        BiometricDevice $device,
        ?Carbon $since = null,
        ?Carbon $until = null,
    ): Generator {
        foreach ($this->punches as $punch) {
            yield $punch;
        }
    }
}
