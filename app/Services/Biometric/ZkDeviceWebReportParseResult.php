<?php

namespace App\Services\Biometric;

final class ZkDeviceWebReportParseResult
{
    /**
     * @param  list<BiometricPunchData>  $punches
     */
    public function __construct(
        public readonly array $punches,
        public readonly bool $tableFound,
        public readonly int $rowsScanned,
        public readonly int $dataRows,
        public readonly ?string $layout,
    ) {}

    public function logLine(): string
    {
        return sprintf(
            'table_found=%s rows=%d data_rows=%d layout=%s punches=%d',
            $this->tableFound ? 'true' : 'false',
            $this->rowsScanned,
            $this->dataRows,
            $this->layout ?? 'none',
            count($this->punches),
        );
    }
}
