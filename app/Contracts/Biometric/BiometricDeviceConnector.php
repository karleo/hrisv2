<?php

namespace App\Contracts\Biometric;

use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricPunchData;
use Generator;
use Illuminate\Support\Carbon;

interface BiometricDeviceConnector
{
    public function testConnection(BiometricDevice $device): bool;

    /**
     * @return Generator<int, BiometricPunchData>
     */
    public function fetchAttendanceLogs(
        BiometricDevice $device,
        ?Carbon $since = null,
        ?Carbon $until = null,
    ): Generator;
}
