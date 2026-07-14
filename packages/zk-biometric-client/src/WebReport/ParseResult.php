<?php

namespace PrimeLogistics\ZkBiometricClient\WebReport;

use PrimeLogistics\ZkBiometricClient\Punch\PunchRecord;

final class ParseResult
{
    /**
     * @param  list<PunchRecord>  $punches
     */
    public function __construct(
        public readonly array $punches,
        public readonly bool $tableFound,
        public readonly int $rowsScanned,
        public readonly int $dataRows,
        public readonly ?string $layout,
    ) {}
}
