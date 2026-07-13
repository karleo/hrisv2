<?php

namespace App\Services\Biometric;

use App\Models\BiometricAdmsCommand;
use App\Models\BiometricDevice;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class BiometricAdmsCommandQueue
{
    /**
     * @return list<string>
     */
    public function drain(BiometricDevice $device): array
    {
        return DB::transaction(function () use ($device): array {
            $rows = BiometricAdmsCommand::query()
                ->where('serial_number', $device->serial_number)
                ->orderBy('id')
                ->lockForUpdate()
                ->get(['id', 'command']);

            if ($rows->isEmpty()) {
                return [];
            }

            BiometricAdmsCommand::query()
                ->whereIn('id', $rows->pluck('id')->all())
                ->delete();

            /** @var list<string> $commands */
            $commands = $rows->pluck('command')->all();

            return $commands;
        });
    }

    public function queueAttlogPull(BiometricDevice $device, Carbon $from, Carbon $until): void
    {
        $timezone = $device->timezone;
        $start = $from->copy()->timezone($timezone)->format('Y-m-d H:i:s');
        $end = $until->copy()->timezone($timezone)->format('Y-m-d H:i:s');

        // Force the next handshake to request a full/range dump instead of "already synced".
        $device->update([
            'metadata' => array_merge($device->metadata ?? [], [
                'last_attlog_stamp' => '0',
                'last_operlog_stamp' => '0',
                'force_attlog_resync_at' => now()->toIso8601String(),
            ]),
        ]);

        // Replace prior pending commands so repeated Imports do not stack forever.
        $this->clearPending($device->serial_number);

        $this->push($device->serial_number, 'CHECK');
        $this->push($device->serial_number, 'INFO');
        $this->push($device->serial_number, "DATA QUERY ATTLOG StartTime={$start}\tEndTime={$end}");
        $this->push($device->serial_number, 'DATA QUERY ATTLOG');
        $this->push($device->serial_number, 'LOG');
    }

    public function clearPending(string $serialNumber): int
    {
        return BiometricAdmsCommand::query()
            ->where('serial_number', $serialNumber)
            ->delete();
    }

    public function pendingCount(string $serialNumber): int
    {
        return BiometricAdmsCommand::query()
            ->where('serial_number', $serialNumber)
            ->count();
    }

    private function push(string $serialNumber, string $command): void
    {
        BiometricAdmsCommand::query()->create([
            'serial_number' => $serialNumber,
            'command' => $command,
            'created_at' => now(),
        ]);
    }
}
