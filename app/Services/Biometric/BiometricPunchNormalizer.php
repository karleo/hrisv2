<?php

namespace App\Services\Biometric;

use App\Enums\BiometricPunchDirection;
use App\Models\BiometricDevice;
use Illuminate\Support\Carbon;

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
        $punchedAt = $this->parseTimestamp($device, is_string($timestamp) ? $timestamp : null);

        return new BiometricPunchData(
            deviceUserId: $deviceUserId,
            punchedAt: $punchedAt,
            direction: $direction,
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

    private function parseTimestamp(BiometricDevice $device, ?string $timestamp): Carbon
    {
        if ($timestamp === null || $timestamp === '') {
            return now($device->timezone);
        }

        return Carbon::parse($timestamp, $device->timezone)->utc();
    }
}
