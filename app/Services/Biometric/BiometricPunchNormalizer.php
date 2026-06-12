<?php

namespace App\Services\Biometric;

use App\Enums\BiometricPunchDirection;
use App\Models\BiometricDevice;

final class BiometricPunchNormalizer
{
    /**
     * @param  array<string, mixed>  $record
     */
    public function fromZkTecoRecord(BiometricDevice $device, array $record): BiometricPunchData
    {
        $deviceUserId = (string) ($record['user_id'] ?? $record['userid'] ?? $record['uid'] ?? '');
        $rawStatus = isset($record['state']) ? (int) $record['state'] : null;
        $direction = $this->mapDirection($rawStatus);

        $timestamp = $record['record_time'] ?? null;
        $punchedAtStorage = is_string($timestamp) && $timestamp !== ''
            ? BiometricPunchClock::storageFromDeviceTimestamp($timestamp, $device->timezone)
            : BiometricPunchClock::normalizeWallClock(now($device->timezone)->format('Y-m-d'), now($device->timezone)->format('H:i:s'));

        return BiometricPunchData::fromDeviceWallClock(
            deviceUserId: $deviceUserId,
            punchedAtStorage: $punchedAtStorage,
            direction: $direction,
            timezone: $device->timezone,
            verifyType: isset($record['type']) ? (int) $record['type'] : null,
            workCode: null,
            rawPayload: $record,
            rawStatus: $rawStatus,
        );
    }

    private function mapDirection(?int $state): BiometricPunchDirection
    {
        return match ($state) {
            0 => BiometricPunchDirection::In,
            1 => BiometricPunchDirection::Out,
            default => BiometricPunchDirection::Unknown,
        };
    }
}
