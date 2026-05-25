<?php

namespace App\Services\Biometric\Connectors;

use App\Contracts\Biometric\BiometricDeviceConnector;
use App\Enums\BiometricConnectionType;
use App\Models\BiometricDevice;
use Generator;
use Illuminate\Support\Carbon;
use RuntimeException;

final class AdmsPushConnector implements BiometricDeviceConnector
{
    public function testConnection(BiometricDevice $device): bool
    {
        if ($device->connection_type !== BiometricConnectionType::AdmsPush) {
            throw new RuntimeException('Device is not configured for ADMS push.');
        }

        if ($this->lastPushAt($device) === null) {
            throw new RuntimeException(
                'No attendance push received yet. On the iClock: Communication → Cloud Server Settings → set Server IP to this HRIS host and Server Port to 80 (or your web port). Serial number must match '.$device->serial_number.'.',
            );
        }

        return true;
    }

    public function fetchAttendanceLogs(
        BiometricDevice $device,
        ?Carbon $since = null,
        ?Carbon $until = null,
    ): Generator {
        yield from [];
    }

    public function lastPushAt(BiometricDevice $device): ?Carbon
    {
        $raw = $device->metadata['last_adms_push_at'] ?? null;

        if (! is_string($raw) || $raw === '') {
            return null;
        }

        return Carbon::parse($raw);
    }

    private function pushUrlHint(): string
    {
        $base = rtrim((string) config('app.url'), '/');

        return $base.'/iclock/cdata';
    }
}
