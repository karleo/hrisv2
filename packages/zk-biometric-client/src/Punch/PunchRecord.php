<?php

namespace PrimeLogistics\ZkBiometricClient\Punch;

use Carbon\CarbonInterface;

final class PunchRecord
{
    public readonly string $punchedAtStorage;

    /**
     * @param  array<string, mixed>  $rawPayload
     */
    public function __construct(
        public string $deviceUserId,
        public CarbonInterface $punchedAt,
        public PunchDirection $direction,
        public ?int $verifyType = null,
        public ?string $workCode = null,
        public array $rawPayload = [],
        public ?int $rawStatus = null,
        ?string $punchedAtStorage = null,
    ) {
        $this->punchedAtStorage = $punchedAtStorage ?? PunchClock::wallClockFromCarbon($punchedAt);
    }

    /**
     * @param  array<string, mixed>  $rawPayload
     */
    public static function fromDeviceWallClock(
        string $deviceUserId,
        string $punchedAtStorage,
        PunchDirection $direction,
        string $timezone,
        ?int $verifyType = null,
        ?string $workCode = null,
        array $rawPayload = [],
        ?int $rawStatus = null,
    ): self {
        return new self(
            deviceUserId: $deviceUserId,
            punchedAt: PunchClock::comparisonCarbon($punchedAtStorage, $timezone),
            direction: $direction,
            verifyType: $verifyType,
            workCode: $workCode,
            rawPayload: $rawPayload,
            rawStatus: $rawStatus,
            punchedAtStorage: $punchedAtStorage,
        );
    }

    /**
     * @return array{device_user_id: string, punched_at: string, direction: string, verify_type: int|null, work_code: string|null, status: int}
     */
    public function toArray(): array
    {
        return [
            'device_user_id' => $this->deviceUserId,
            'punched_at' => $this->punchedAtStorage,
            'direction' => $this->direction->value,
            'verify_type' => $this->verifyType,
            'work_code' => $this->workCode,
            'status' => $this->rawStatus ?? ($this->direction === PunchDirection::Out ? 1 : 0),
        ];
    }

    /**
     * @param  array{device_user_id: string, punched_at: string, direction?: string, verify_type?: int|null, work_code?: string|null, status?: int|null}  $data
     */
    public static function fromArray(array $data, string $timezone = 'UTC'): self
    {
        $direction = ($data['direction'] ?? '') === PunchDirection::Out->value
            || (int) ($data['status'] ?? 0) === 1
            ? PunchDirection::Out
            : PunchDirection::In;

        return self::fromDeviceWallClock(
            deviceUserId: (string) $data['device_user_id'],
            punchedAtStorage: (string) $data['punched_at'],
            direction: $direction,
            timezone: $timezone,
            verifyType: isset($data['verify_type']) ? (int) $data['verify_type'] : null,
            workCode: isset($data['work_code']) ? (string) $data['work_code'] : null,
            rawStatus: isset($data['status']) ? (int) $data['status'] : null,
        );
    }
}
