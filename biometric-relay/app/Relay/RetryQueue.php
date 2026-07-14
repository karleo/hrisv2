<?php

namespace BiometricRelay\Relay;

use PrimeLogistics\ZkBiometricClient\Punch\PunchRecord;

final class RetryQueue
{
    public function __construct(
        private readonly string $path,
        private readonly string $timezone,
    ) {}

    /**
     * @return list<PunchRecord>
     */
    public function all(): array
    {
        if (! is_file($this->path)) {
            return [];
        }

        $decoded = json_decode((string) file_get_contents($this->path), true);

        if (! is_array($decoded)) {
            return [];
        }

        $punches = [];

        foreach ($decoded as $row) {
            if (! is_array($row)) {
                continue;
            }

            $punches[] = PunchRecord::fromArray($row, $this->timezone);
        }

        return $punches;
    }

    public function count(): int
    {
        return count($this->all());
    }

    /**
     * @param  list<PunchRecord>  $punches
     */
    public function replace(array $punches): void
    {
        $directory = dirname($this->path);

        if (! is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $payload = array_map(
            fn (PunchRecord $punch): array => $punch->toArray(),
            $punches,
        );

        file_put_contents(
            $this->path,
            json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n",
        );
    }

    /**
     * @param  list<PunchRecord>  $punches
     */
    public function append(array $punches): void
    {
        if ($punches === []) {
            return;
        }

        $merged = $this->uniqueByKey([...$this->all(), ...$punches]);
        $this->replace($merged);
    }

    public function clear(): void
    {
        $this->replace([]);
    }

    /**
     * @param  list<PunchRecord>  $punches
     * @return list<PunchRecord>
     */
    private function uniqueByKey(array $punches): array
    {
        $unique = [];

        foreach ($punches as $punch) {
            $key = $punch->deviceUserId.'|'.$punch->punchedAtStorage.'|'.$punch->direction->value;
            $unique[$key] = $punch;
        }

        usort(
            $unique,
            fn (PunchRecord $a, PunchRecord $b): int => strcmp($a->punchedAtStorage, $b->punchedAtStorage),
        );

        return array_values($unique);
    }
}
