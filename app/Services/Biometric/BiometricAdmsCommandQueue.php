<?php

namespace App\Services\Biometric;

use App\Models\BiometricDevice;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

final class BiometricAdmsCommandQueue
{
    private const string CACHE_PREFIX = 'biometric_adms_commands:';

    /**
     * @return list<string>
     */
    public function drain(BiometricDevice $device): array
    {
        $key = $this->cacheKey($device->serial_number);
        /** @var list<string> $commands */
        $commands = Cache::pull($key, []);

        return $commands;
    }

    public function queueAttlogPull(BiometricDevice $device, Carbon $from, Carbon $until): void
    {
        $timezone = $device->timezone;
        $start = $from->copy()->timezone($timezone)->format('Y-m-d H:i:s');
        $end = $until->copy()->timezone($timezone)->format('Y-m-d H:i:s');

        $this->push($device->serial_number, 'CHECK');
        $this->push($device->serial_number, 'INFO');
        $this->push($device->serial_number, "DATA QUERY ATTLOG StartTime={$start}\tEndTime={$end}");
        $this->push($device->serial_number, 'DATA QUERY ATTLOG');
        $this->push($device->serial_number, 'LOG');
    }

    public function pendingCount(string $serialNumber): int
    {
        /** @var list<string> $commands */
        $commands = Cache::get($this->cacheKey($serialNumber), []);

        return count($commands);
    }

    private function push(string $serialNumber, string $command): void
    {
        $key = $this->cacheKey($serialNumber);
        /** @var list<string> $commands */
        $commands = Cache::get($key, []);
        $commands[] = $command;
        Cache::put($key, $commands, now()->addHours(6));
    }

    private function cacheKey(string $serialNumber): string
    {
        return self::CACHE_PREFIX.$serialNumber;
    }
}
