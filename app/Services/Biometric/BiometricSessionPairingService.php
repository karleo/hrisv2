<?php

namespace App\Services\Biometric;

use App\Enums\BiometricPunchDirection;
use App\Enums\BiometricSessionAnomalyType;
use App\Models\BiometricAttendanceSession;
use App\Models\BiometricDevice;
use App\Models\BiometricPunch;
use App\Models\BiometricSessionAnomaly;
use Illuminate\Support\Collection;

final class BiometricSessionPairingService
{
    /**
     * @return array{created: int, updated: int}
     */
    public function processUnprocessedPunches(?BiometricDevice $device = null): array
    {
        $created = 0;
        $updated = 0;

        $query = BiometricPunch::query()
            ->whereNull('processed_at')
            ->orderBy('punched_at')
            ->orderBy('id');

        if ($device !== null) {
            $query->where('biometric_device_id', $device->id);
        }

        $query->chunkById(500, function (Collection $punches) use (&$created, &$updated): void {
            foreach ($punches as $punch) {
                /** @var BiometricPunch $punch */
                $result = $this->processPunch($punch);
                $created += $result['created'];
                $updated += $result['updated'];
            }
        });

        return ['created' => $created, 'updated' => $updated];
    }

    /**
     * @return array{created: int, updated: int}
     */
    public function processUnprocessedPunchesInRange(
        BiometricDevice $device,
        \Illuminate\Support\Carbon $from,
        \Illuminate\Support\Carbon $until,
    ): array {
        $created = 0;
        $updated = 0;

        BiometricPunch::query()
            ->where('biometric_device_id', $device->id)
            ->whereNull('processed_at')
            ->whereBetween('punched_at', [$from, $until])
            ->orderBy('punched_at')
            ->orderBy('id')
            ->chunkById(500, function (Collection $punches) use (&$created, &$updated): void {
                foreach ($punches as $punch) {
                    /** @var BiometricPunch $punch */
                    $result = $this->processPunch($punch);
                    $created += $result['created'];
                    $updated += $result['updated'];
                }
            });

        return ['created' => $created, 'updated' => $updated];
    }

    /**
     * @return int Number of punches reset for re-pairing
     */
    public function resetProcessedFlagInRange(
        BiometricDevice $device,
        \Illuminate\Support\Carbon $from,
        \Illuminate\Support\Carbon $until,
    ): int {
        return BiometricPunch::query()
            ->where('biometric_device_id', $device->id)
            ->whereBetween('punched_at', [$from, $until])
            ->whereNotNull('processed_at')
            ->update([
                'processed_at' => null,
                'biometric_attendance_session_id' => null,
            ]);
    }

    /**
     * @return array{created: int, updated: int}
     */
    private function processPunch(BiometricPunch $punch): array
    {
        if ($punch->employee_id === null) {
            $this->logAnomaly(
                $punch,
                BiometricSessionAnomalyType::UnmappedPunch,
                'Punch has no mapped employee.',
            );
            $this->markProcessed($punch);

            return ['created' => 0, 'updated' => 0];
        }

        $direction = $this->resolveDirection($punch);

        return match ($direction) {
            BiometricPunchDirection::In => $this->handleIn($punch),
            BiometricPunchDirection::Out => $this->handleOut($punch),
            BiometricPunchDirection::Unknown => $this->handleUnknown($punch),
        };
    }

    /**
     * @return array{created: int, updated: int}
     */
    private function handleIn(BiometricPunch $punch): array
    {
        $openSession = $this->findOpenSession($punch->employee_id);

        if ($openSession !== null) {
            $this->logAnomaly(
                $punch,
                BiometricSessionAnomalyType::DuplicateIn,
                'Employee already has an open session.',
                ['open_session_id' => $openSession->id],
            );
            $this->markProcessed($punch);

            return ['created' => 0, 'updated' => 0];
        }

        $session = BiometricAttendanceSession::query()->create([
            'employee_id' => $punch->employee_id,
            'biometric_device_id' => $punch->biometric_device_id,
            'clock_in_at' => $punch->punched_at,
            'clock_out_at' => null,
            'clock_in_punch_id' => $punch->id,
            'clock_out_punch_id' => null,
            'working_minutes' => null,
            'is_open' => true,
        ]);

        $this->linkPunchToSession($punch, $session->id);

        return ['created' => 1, 'updated' => 0];
    }

    /**
     * @return array{created: int, updated: int}
     */
    private function handleOut(BiometricPunch $punch): array
    {
        $openSession = $this->findOpenSession($punch->employee_id);

        if ($openSession === null) {
            $this->logAnomaly(
                $punch,
                BiometricSessionAnomalyType::OrphanOut,
                'OUT punch received with no open session.',
            );
            $this->markProcessed($punch);

            return ['created' => 0, 'updated' => 0];
        }

        $this->closeSession($openSession, $punch);

        return ['created' => 0, 'updated' => 1];
    }

    /**
     * @return array{created: int, updated: int}
     */
    private function handleUnknown(BiometricPunch $punch): array
    {
        $openSession = $this->findOpenSession($punch->employee_id);

        if ($openSession !== null) {
            $this->closeSession($openSession, $punch);

            return ['created' => 0, 'updated' => 1];
        }

        return $this->handleIn($punch);
    }

    private function resolveDirection(BiometricPunch $punch): BiometricPunchDirection
    {
        return $punch->direction;
    }

    private function findOpenSession(int $employeeId): ?BiometricAttendanceSession
    {
        return BiometricAttendanceSession::query()
            ->where('employee_id', $employeeId)
            ->where('is_open', true)
            ->orderByDesc('clock_in_at')
            ->first();
    }

    private function closeSession(BiometricAttendanceSession $session, BiometricPunch $outPunch): void
    {
        $workingMinutes = max(0, $session->clock_in_at->diffInMinutes($outPunch->punched_at));

        $session->update([
            'clock_out_at' => $outPunch->punched_at,
            'clock_out_punch_id' => $outPunch->id,
            'working_minutes' => $workingMinutes,
            'is_open' => false,
        ]);

        $this->linkPunchToSession($outPunch, $session->id);
    }

    private function linkPunchToSession(BiometricPunch $punch, int $sessionId): void
    {
        $punch->update([
            'biometric_attendance_session_id' => $sessionId,
            'processed_at' => now(),
        ]);
    }

    private function markProcessed(BiometricPunch $punch): void
    {
        $punch->update(['processed_at' => now()]);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function logAnomaly(
        BiometricPunch $punch,
        BiometricSessionAnomalyType $type,
        string $message,
        array $context = [],
    ): void {
        BiometricSessionAnomaly::query()->create([
            'biometric_punch_id' => $punch->id,
            'employee_id' => $punch->employee_id,
            'biometric_device_id' => $punch->biometric_device_id,
            'type' => $type,
            'message' => $message,
            'context' => $context,
        ]);
    }
}
