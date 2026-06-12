<?php

namespace App\Services\Biometric;

use App\Enums\BiometricPunchDirection;
use Carbon\CarbonInterface;

final class BiometricPunchData
{
    /** Exact Y-m-d H:i:s value written to the database (device wall clock). */
    public readonly string $punchedAtStorage;

    /**
     * @param  array<string, mixed>  $rawPayload
     */
    public function __construct(
        public string $deviceUserId,
        public CarbonInterface $punchedAt,
        public BiometricPunchDirection $direction,
        public ?int $verifyType = null,
        public ?string $workCode = null,
        public array $rawPayload = [],
        public ?int $rawStatus = null,
        ?string $punchedAtStorage = null,
    ) {
        $this->punchedAtStorage = $punchedAtStorage ?? BiometricPunchClock::wallClockFromCarbon($punchedAt);
    }

    /**
     * @param  array<string, mixed>  $rawPayload
     */
    public static function fromDeviceWallClock(
        string $deviceUserId,
        string $punchedAtStorage,
        BiometricPunchDirection $direction,
        string $timezone,
        ?int $verifyType = null,
        ?string $workCode = null,
        array $rawPayload = [],
        ?int $rawStatus = null,
    ): self {
        return new self(
            deviceUserId: $deviceUserId,
            punchedAt: BiometricPunchClock::comparisonCarbon($punchedAtStorage, $timezone),
            direction: $direction,
            verifyType: $verifyType,
            workCode: $workCode,
            rawPayload: $rawPayload,
            rawStatus: $rawStatus,
            punchedAtStorage: $punchedAtStorage,
        );
    }
}
