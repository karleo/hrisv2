<?php

namespace App\Services\Biometric;

use App\Enums\BiometricConnectionType;
use App\Enums\BiometricSyncStatus;
use App\Enums\BiometricSyncType;
use App\Models\BiometricDevice;
use App\Models\BiometricPunch;
use App\Models\BiometricSyncLog;
use App\Support\BiometricPushUrl;
use Illuminate\Support\Carbon;
use Throwable;

final class BiometricSyncPipeline
{
    public function __construct(
        private readonly BiometricConnectorFactory $connectorFactory,
        private readonly BiometricPunchImporter $importer,
        private readonly BiometricEmployeeMapper $employeeMapper,
        private readonly BiometricSessionPairingService $sessionPairing,
        private readonly BiometricAdmsCommandQueue $admsCommandQueue,
        private readonly BiometricWebReportFallback $webReportFallback,
        private readonly BiometricPipelineTracer $tracer,
    ) {}

    public function createPendingLog(
        BiometricDevice $device,
        BiometricSyncType $syncType = BiometricSyncType::Manual,
        ?int $triggeredBy = null,
        ?Carbon $from = null,
        ?Carbon $until = null,
    ): BiometricSyncLog {
        return BiometricSyncLog::query()->create([
            'biometric_device_id' => $device->id,
            'triggered_by' => $triggeredBy,
            'sync_type' => $syncType,
            'status' => BiometricSyncStatus::Running,
            'started_at' => now(),
            'error_metadata' => $this->rangeMetadata($from, $until),
        ]);
    }

    public function run(
        BiometricDevice $device,
        BiometricSyncType $syncType = BiometricSyncType::Manual,
        ?int $triggeredBy = null,
        ?Carbon $from = null,
        ?Carbon $until = null,
        ?int $syncLogId = null,
    ): BiometricSyncLog {
        $syncLog = $syncLogId !== null
            ? BiometricSyncLog::query()->findOrFail($syncLogId)
            : $this->createPendingLog($device, $syncType, $triggeredBy, $from, $until);

        $this->tracer->reset();
        $this->tracer->stage('pipeline_run_start', [
            'device_id' => $device->id,
            'sync_log_id' => $syncLog->id,
            'connection_type' => $device->connection_type->value,
        ]);

        try {
            if (! $device->is_active) {
                throw new \RuntimeException('Device is not active.');
            }

            $importResult = ['inserted' => 0, 'duplicate' => 0, 'failed' => 0];
            $deviceRecords = 0;
            $inRange = 0;
            [$fromBound, $untilBound] = $this->storageRangeBounds($device, $from, $until);

            if ($this->shouldProcessStoredPunchesOnly($device, $from, $until)) {
                $admsQueued = false;
                $webFetchError = null;

                if ($from !== null && $until !== null) {
                    $this->admsCommandQueue->queueAttlogPull($device, $from, $until);
                    $admsQueued = true;

                    [$webPunches, $webFetchError] = $this->webReportFallback->fetchPunches($device, $from, $until);

                    if ($webPunches !== []) {
                        $webImport = $this->importer->import($device, $webPunches);
                        $importResult['inserted'] += $webImport['inserted'];
                        $importResult['duplicate'] += $webImport['duplicate'];
                        $importResult['failed'] += $webImport['failed'];
                        $deviceRecords = count($webPunches);
                        $inRange = count($webPunches);
                    }
                }

                [$storedInRange] = $this->storedPunchCounts($device, $fromBound, $untilBound);

                if ($storedInRange > 0) {
                    $deviceRecords = max($deviceRecords, $storedInRange);
                    $inRange = max($inRange, $storedInRange);
                }

                $reset = $this->sessionPairing->resetProcessedFlagInRange($device, $from, $until);
                $mapResult = $this->employeeMapper->mapForDevice($device);
                $sessionResult = $this->sessionPairing->processUnprocessedPunchesInRange($device, $from, $until);

                $errorMessage = $this->storedRangeMessage(
                    $device,
                    $inRange,
                    $mapResult['unmapped'],
                    $reset,
                    $admsQueued,
                    $webFetchError,
                );
            } else {
                $connector = $this->connectorFactory->forDevice($device);
                $fetchFrom = $from;
                $fetchUntil = $until;

                if ($fetchFrom === null && $fetchUntil === null) {
                    $fetchFrom = $this->syncSince($device);
                }

                $punches = [];
                $skippedOutOfRange = 0;

                foreach ($connector->fetchAttendanceLogs($device, $fetchFrom, $fetchUntil) as $punch) {
                    $deviceRecords++;

                    if ($fromBound !== null && BiometricPunchClock::isBefore($punch->punchedAtStorage, $fromBound)) {
                        $skippedOutOfRange++;

                        continue;
                    }

                    if ($untilBound !== null && BiometricPunchClock::isAfter($punch->punchedAtStorage, $untilBound)) {
                        $skippedOutOfRange++;

                        continue;
                    }

                    $inRange++;
                    $punches[] = $punch;
                }

                $this->tracer->stage('pipeline_before_import', [
                    'punches_received' => $deviceRecords,
                    'punches_in_range' => $inRange,
                    'punches_skipped_out_of_range' => $skippedOutOfRange,
                ]);

                $importResult = $this->importer->import($device, $punches, $this->tracer);
                $skipEmployeeMapping = (bool) ($device->metadata['skip_employee_mapping']
                    ?? config('biometric.skip_employee_mapping_on_import', false));

                $this->tracer->log('pipeline_import punches_saved='.$importResult['inserted'].' punches_skipped='.($importResult['duplicate'] + $importResult['failed']), [
                    'duplicate' => $importResult['duplicate'],
                    'failed' => $importResult['failed'],
                    'skip_employee_mapping' => $skipEmployeeMapping,
                ]);

                if ($skipEmployeeMapping) {
                    $mapResult = ['mapped' => 0, 'unmapped' => 0];
                    $sessionResult = ['created' => 0, 'updated' => 0];
                } else {
                    $mapResult = $this->employeeMapper->mapForDevice($device);
                    $sessionResult = $from !== null && $until !== null
                        ? $this->sessionPairing->processUnprocessedPunchesInRange($device, $from, $until)
                        : $this->sessionPairing->processUnprocessedPunches($device);
                }

                $errorMessage = $deviceRecords === 0
                    ? $this->noDeviceRecordsMessage($device, $from, $until, $inRange)
                    : ($inRange === 0 && $deviceRecords > 0
                        ? $this->noDeviceRecordsInRangeMessage($device, $from, $until, $deviceRecords)
                        : ($importResult['inserted'] > 0 && $skipEmployeeMapping
                            ? $importResult['inserted'].' punch(es) imported. Employee mapping skipped — open Raw punches to review device PINs.'
                            : null));
            }

            $failed = $deviceRecords === 0
                && $importResult['inserted'] === 0
                && $inRange === 0
                && $errorMessage !== null;

            $syncLog->update([
                'status' => $failed ? BiometricSyncStatus::Failed : BiometricSyncStatus::Completed,
                'finished_at' => now(),
                'fetched_count' => $deviceRecords,
                'error_metadata' => array_merge(
                    $this->completedMetadata($from, $until, $deviceRecords, $inRange),
                    ['pipeline_trace' => $this->tracer->stages()],
                ),
                'error_message' => $errorMessage,
                'inserted_count' => $importResult['inserted'],
                'duplicate_count' => $importResult['duplicate'],
                'unmapped_count' => $mapResult['unmapped'],
                'failed_count' => $importResult['failed'],
                'sessions_created_count' => $sessionResult['created'],
                'sessions_updated_count' => $sessionResult['updated'],
            ]);

            $device->update([
                'last_sync_at' => now(),
                'last_sync_status' => ($failed ? BiometricSyncStatus::Failed : BiometricSyncStatus::Completed)->value,
                'last_error' => $failed ? $errorMessage : null,
            ]);
        } catch (Throwable $exception) {
            $this->tracer->stage('pipeline_run_failed', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            $syncLog->update([
                'status' => BiometricSyncStatus::Failed,
                'finished_at' => now(),
                'error_message' => $exception->getMessage(),
                'error_metadata' => [
                    'exception' => $exception::class,
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                    'pipeline_trace' => $this->tracer->stages(),
                ],
            ]);

            $device->update([
                'last_sync_status' => BiometricSyncStatus::Failed->value,
                'last_error' => $exception->getMessage(),
            ]);
        }

        return $syncLog->fresh();
    }

    /**
     * @return array{0: ?string, 1: ?string}
     */
    private function storageRangeBounds(BiometricDevice $device, ?Carbon $from, ?Carbon $until): array
    {
        $timezone = $device->timezone;

        $fromBound = $from !== null
            ? $from->copy()->timezone($timezone)->startOfDay()->format('Y-m-d H:i:s')
            : null;

        $untilBound = $until !== null
            ? $until->copy()->timezone($timezone)->endOfDay()->format('Y-m-d H:i:s')
            : null;

        return [$fromBound, $untilBound];
    }

    /**
     * @return array{0: ?Carbon, 1: ?Carbon}
     */
    public function parsePullRange(BiometricDevice $device, ?string $from, ?string $to): array
    {
        $timezone = $device->timezone;

        $fromCarbon = $from !== null && $from !== ''
            ? Carbon::parse($from, $timezone)->startOfDay()->utc()
            : null;

        $untilCarbon = $to !== null && $to !== ''
            ? Carbon::parse($to, $timezone)->endOfDay()->utc()
            : null;

        return [$fromCarbon, $untilCarbon];
    }

    private function syncSince(BiometricDevice $device): ?Carbon
    {
        if ($device->last_sync_at === null) {
            return null;
        }

        return $device->last_sync_at->copy()->subMinutes(2);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function rangeMetadata(?Carbon $from, ?Carbon $until): ?array
    {
        if ($from === null && $until === null) {
            return null;
        }

        return array_filter([
            'from' => $from?->toIso8601String(),
            'until' => $until?->toIso8601String(),
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function completedMetadata(
        ?Carbon $from,
        ?Carbon $until,
        int $deviceRecords,
        int $inRange,
    ): ?array {
        $metadata = $this->rangeMetadata($from, $until) ?? [];

        if ($deviceRecords > 0 || $inRange > 0 || $from !== null || $until !== null) {
            $metadata['device_records'] = $deviceRecords;
            $metadata['in_range'] = $inRange;
        }

        return $metadata === [] ? null : $metadata;
    }

    private function shouldProcessStoredPunchesOnly(
        BiometricDevice $device,
        ?Carbon $from,
        ?Carbon $until,
    ): bool {
        if ($device->connection_type === BiometricConnectionType::AdmsPush) {
            return $from !== null && $until !== null;
        }

        return false;
    }

    /**
     * @return array{0: int, 1: int} [inRange, totalOnDevice]
     */
    private function storedPunchCounts(BiometricDevice $device, ?string $fromBound, ?string $untilBound): array
    {
        $query = BiometricPunch::query()->where('biometric_device_id', $device->id);

        $total = (clone $query)->count();

        $inRangeQuery = clone $query;

        if ($fromBound !== null) {
            $inRangeQuery->where('punched_at', '>=', $fromBound);
        }

        if ($untilBound !== null) {
            $inRangeQuery->where('punched_at', '<=', $untilBound);
        }

        $inRange = $inRangeQuery->count();

        return [$inRange, $total];
    }

    /**
     * @param  array{mapped: int, unmapped: int}  $mapResult
     */
    private function storedRangeMessage(
        BiometricDevice $device,
        int $inRange,
        int $unmapped,
        int $reset,
        bool $admsCommandsQueued = false,
        ?string $webFetchError = null,
    ): ?string {
        if ($inRange === 0) {
            $lastPush = $device->metadata['last_adms_push_at'] ?? null;
            $pushUrl = BiometricPushUrl::cdataEndpoint();
            $deviceWebUrl = $device->host !== null && $device->host !== ''
                ? rtrim($device->deviceWebBaseUrl(), '/')
                : null;

            $parts = [];

            if ($webFetchError !== null) {
                $parts[] = 'Web report pull failed: '.$webFetchError;
            }

            if ($deviceWebUrl !== null) {
                $parts[] = 'Permanent fix: Connectivity → Switch to web report pull, or set connection to Device web report on Devices. Then import with the same dates you use on the device at '.$deviceWebUrl.'.';
            }

            if ($admsCommandsQueued) {
                $parts[] = 'ADMS commands were queued for the terminal. Set cloud server to '.$pushUrl.' (serial '.$device->serial_number.'), wait 2 minutes, punch once, then import again.';
            } elseif ($lastPush) {
                $parts[] = 'No punches in this date range. Last push: '.$lastPush.'.';
            } else {
                $parts[] = 'No punches in HRIS yet. Configure cloud server: '.$pushUrl.' (use PC LAN IP, not the device IP).';
            }

            return implode(' ', $parts);
        }

        if ($unmapped > 0) {
            return "{$inRange} punch(es) in range; {$unmapped} still unmapped — set Biometric user ID on employees to match device PINs. View Sessions after mapping.";
        }

        if ($reset > 0) {
            return null;
        }

        return $inRange > 0
            ? 'Processed stored punches for this date range. Open Sessions tab with the same dates to see clock-in/out.'
            : null;
    }

    private function noDeviceRecordsMessage(
        BiometricDevice $device,
        ?Carbon $from,
        ?Carbon $until,
        int $inRange,
    ): string {
        $range = $this->formatPullRange($device, $from, $until);

        $deviceWebUrl = $device->host !== null && $device->host !== ''
            ? rtrim($device->deviceWebBaseUrl(), '/')
            : 'http://DEVICE_IP';

        return 'Device returned no attendance records for '.$range.'. '
            .'On the device at '.$deviceWebUrl.', open Report, set the same From/To dates, click Search, and confirm ID Number rows appear. '
            .'Then run import again with that exact range.';
    }

    private function noDeviceRecordsInRangeMessage(
        BiometricDevice $device,
        ?Carbon $from,
        ?Carbon $until,
        int $deviceRecords,
    ): string {
        $range = $this->formatPullRange($device, $from, $until);

        return "Device returned {$deviceRecords} punch(es) but none fell in {$range}. Widen or change the import dates to match the device report.";
    }

    private function formatPullRange(BiometricDevice $device, ?Carbon $from, ?Carbon $until): string
    {
        $timezone = $device->timezone;

        if ($from !== null && $until !== null) {
            return $from->copy()->timezone($timezone)->format('Y-m-d')
                .' to '
                .$until->copy()->timezone($timezone)->format('Y-m-d');
        }

        return 'the selected range';
    }
}
