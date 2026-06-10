<?php

namespace App\Services\Biometric;

use App\Enums\BiometricPunchDirection;
use App\Models\BiometricDevice;
use App\Models\BiometricPunch;

final class BiometricPunchImporter
{
    private const BATCH_SIZE = 500;

    public function __construct(
        private readonly BiometricEmployeeMapper $employeeMapper,
    ) {}

    /**
     * @param  iterable<BiometricPunchData>  $punches
     * @return array{inserted: int, duplicate: int, failed: int}
     */
    public function import(BiometricDevice $device, iterable $punches, ?BiometricPipelineTracer $tracer = null): array
    {
        $inserted = 0;
        $duplicate = 0;
        $failed = 0;
        $batch = [];
        $received = 0;

        $tracer?->stage('importer_start', ['device_id' => $device->id]);

        $skipEmployeeMapping = (bool) ($device->metadata['skip_employee_mapping']
            ?? config('biometric.skip_employee_mapping_on_import', false));
        $employeeMap = $skipEmployeeMapping ? null : $this->employeeMapper->employeeMapByDevicePin();

        foreach ($punches as $punch) {
            $received++;
            $batch[] = $this->toRow($device, $punch, $employeeMap);

            if (count($batch) >= self::BATCH_SIZE) {
                $result = $this->insertBatch($batch);
                $inserted += $result['inserted'];
                $duplicate += $result['duplicate'];
                $failed += $result['failed'];
                $batch = [];
            }
        }

        if ($batch !== []) {
            $result = $this->insertBatch($batch);
            $inserted += $result['inserted'];
            $duplicate += $result['duplicate'];
            $failed += $result['failed'];
        }

        $skipped = $duplicate + $failed;

        $tracer?->log('punches_received='.$received.' punches_saved='.$inserted.' punches_skipped='.$skipped, [
            'duplicate' => $duplicate,
            'failed' => $failed,
        ]);

        return [
            'inserted' => $inserted,
            'duplicate' => $duplicate,
            'failed' => $failed,
            'received' => $received,
        ];
    }

    public function idempotencyKey(
        int $deviceId,
        string $deviceUserId,
        string $punchedAt,
        BiometricPunchDirection $direction,
        ?int $rawStatus,
    ): string {
        return hash('sha256', implode('|', [
            $deviceId,
            $deviceUserId,
            $punchedAt,
            $direction->value,
            (string) ($rawStatus ?? ''),
        ]));
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array{inserted: int, duplicate: int, failed: int}
     */
    private function insertBatch(array $rows): array
    {
        $keys = collect($rows)->pluck('idempotency_key');
        $existing = BiometricPunch::query()
            ->whereIn('idempotency_key', $keys)
            ->pluck('idempotency_key')
            ->all();

        $existingSet = array_flip($existing);
        $newRows = array_values(array_filter(
            $rows,
            fn (array $row): bool => ! isset($existingSet[$row['idempotency_key']]),
        ));

        $duplicate = count($rows) - count($newRows);

        if ($newRows === []) {
            return ['inserted' => 0, 'duplicate' => $duplicate, 'failed' => 0];
        }

        try {
            BiometricPunch::query()->insert($newRows);

            return ['inserted' => count($newRows), 'duplicate' => $duplicate, 'failed' => 0];
        } catch (\Throwable) {
            return ['inserted' => 0, 'duplicate' => $duplicate, 'failed' => count($newRows)];
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<string, int>|null  $employeeMap
     * @return array<string, mixed>
     */
    private function toRow(BiometricDevice $device, BiometricPunchData $punch, ?\Illuminate\Support\Collection $employeeMap): array
    {
        $punchedAt = $punch->punchedAtStorage;
        $now = now()->format('Y-m-d H:i:s');
        $employeeId = $employeeMap !== null
            ? $this->employeeMapper->employeeIdForDeviceUserId($punch->deviceUserId, $employeeMap)
            : null;

        return [
            'biometric_device_id' => $device->id,
            'device_user_id' => $punch->deviceUserId,
            'employee_id' => $employeeId,
            'punched_at' => $punchedAt,
            'direction' => $punch->direction->value,
            'verify_type' => $punch->verifyType,
            'work_code' => $punch->workCode,
            'idempotency_key' => $this->idempotencyKey(
                $device->id,
                $punch->deviceUserId,
                $punchedAt,
                $punch->direction,
                $punch->rawStatus,
            ),
            'processed_at' => null,
            'biometric_attendance_session_id' => null,
            'raw_payload' => json_encode($punch->rawPayload),
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }
}
