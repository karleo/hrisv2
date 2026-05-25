<?php

namespace App\Services\Biometric;

use App\Enums\BiometricPunchDirection;
use Carbon\CarbonInterface;

final class BiometricPunchData
{
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
    ) {}
}
