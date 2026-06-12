<?php

namespace App\Services\Biometric;

use App\Enums\BiometricPunchDirection;
use App\Models\BiometricDevice;

final class IclockAdmsAttendanceParser
{
    public function parseLine(BiometricDevice $device, string $line): ?BiometricPunchData
    {
        $line = trim($line);

        if ($line === '') {
            return null;
        }

        $parts = preg_split("/\t+/", $line) ?: [];

        if (count($parts) < 2) {
            return null;
        }

        $deviceUserId = trim($parts[0]);
        $timestamp = trim($parts[1]);

        if ($deviceUserId === '' || $timestamp === '') {
            return null;
        }

        $rawStatus = isset($parts[2]) && is_numeric($parts[2]) ? (int) $parts[2] : null;

        return BiometricPunchData::fromDeviceWallClock(
            deviceUserId: $deviceUserId,
            punchedAtStorage: BiometricPunchClock::storageFromDeviceTimestamp($timestamp, $device->timezone),
            timezone: $device->timezone,
            direction: match ($rawStatus) {
                0 => BiometricPunchDirection::In,
                1 => BiometricPunchDirection::Out,
                default => BiometricPunchDirection::Unknown,
            },
            verifyType: isset($parts[3]) && is_numeric($parts[3]) ? (int) $parts[3] : null,
            workCode: isset($parts[5]) && is_numeric($parts[5]) ? (int) $parts[5] : null,
            rawPayload: ['line' => $line, 'parts' => $parts],
            rawStatus: $rawStatus,
        );
    }

    /**
     * @return list<BiometricPunchData>
     */
    public function parseBody(BiometricDevice $device, string $body): array
    {
        $punches = [];

        foreach (preg_split("/\r\n|\n|\r/", $body) ?: [] as $line) {
            $punch = $this->parseLine($device, $line);

            if ($punch !== null) {
                $punches[] = $punch;
            }
        }

        return $punches;
    }
}
