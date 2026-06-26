<?php

namespace App\Services\Biometric;

use App\Enums\BiometricSyncStatus;
use App\Enums\BiometricSyncType;
use App\Models\BiometricDevice;
use App\Models\BiometricSyncLog;
use Illuminate\Http\UploadedFile;
use RuntimeException;
use Throwable;

final class BiometricFileUploadService
{
    public function __construct(
        private readonly BiometricFileUploadParser $parser,
        private readonly BiometricPunchImporter $importer,
        private readonly BiometricEmployeeMapper $employeeMapper,
        private readonly BiometricSessionPairingService $sessionPairing,
    ) {}

    public function upload(
        BiometricDevice $device,
        UploadedFile $file,
        ?int $triggeredBy = null,
        ?string $format = null,
    ): BiometricSyncLog {
        if (! $device->is_active) {
            throw new RuntimeException('Device is not active. Enable it on the Devices tab first.');
        }

        $contents = file_get_contents($file->getRealPath());

        if ($contents === false) {
            throw new RuntimeException('Unable to read the uploaded file.');
        }

        $syncLog = BiometricSyncLog::query()->create([
            'biometric_device_id' => $device->id,
            'triggered_by' => $triggeredBy,
            'sync_type' => BiometricSyncType::FileUpload,
            'status' => BiometricSyncStatus::Running,
            'started_at' => now(),
            'error_metadata' => [
                'source' => 'file_upload',
                'filename' => $file->getClientOriginalName(),
                'format_hint' => $format,
            ],
        ]);

        try {
            $parseResult = $this->parser->parse($device, $contents, $format);
            $punches = $parseResult['punches'];

            if ($punches === []) {
                throw new RuntimeException(
                    'No attendance rows were found in the file. Check the format and try again.',
                );
            }

            $importResult = $this->importer->import($device, $punches);
            $skipEmployeeMapping = (bool) ($device->metadata['skip_employee_mapping']
                ?? config('biometric.skip_employee_mapping_on_import', false));

            if ($skipEmployeeMapping) {
                $mapResult = ['mapped' => 0, 'unmapped' => 0];
                $sessionResult = ['created' => 0, 'updated' => 0];
            } else {
                $mapResult = $this->employeeMapper->mapForDevice($device);
                $sessionResult = $this->sessionPairing->processUnprocessedPunches($device);
            }

            $message = $this->buildSummaryMessage(
                $parseResult,
                $importResult,
                $mapResult['unmapped'],
                $skipEmployeeMapping,
            );

            $syncLog->update([
                'status' => BiometricSyncStatus::Completed,
                'finished_at' => now(),
                'fetched_count' => count($punches),
                'inserted_count' => $importResult['inserted'],
                'duplicate_count' => $importResult['duplicate'],
                'unmapped_count' => $mapResult['unmapped'],
                'failed_count' => $importResult['failed'],
                'sessions_created_count' => $sessionResult['created'],
                'sessions_updated_count' => $sessionResult['updated'],
                'error_message' => $message,
                'error_metadata' => array_merge($syncLog->error_metadata ?? [], [
                    'format' => $parseResult['format'],
                    'lines_total' => $parseResult['lines_total'],
                    'lines_parsed' => $parseResult['lines_parsed'],
                    'lines_skipped' => $parseResult['lines_skipped'],
                ]),
            ]);

            $device->update([
                'last_sync_at' => now(),
                'last_sync_status' => BiometricSyncStatus::Completed->value,
                'last_error' => null,
            ]);

            return $syncLog->refresh();
        } catch (Throwable $exception) {
            $syncLog->update([
                'status' => BiometricSyncStatus::Failed,
                'finished_at' => now(),
                'error_message' => $exception->getMessage(),
            ]);

            $device->update([
                'last_sync_status' => BiometricSyncStatus::Failed->value,
                'last_error' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    /**
     * @param  array{
     *     format: string,
     *     lines_total: int,
     *     lines_parsed: int,
     *     lines_skipped: int,
     * }  $parseResult
     * @param  array{inserted: int, duplicate: int, failed: int}  $importResult
     */
    private function buildSummaryMessage(
        array $parseResult,
        array $importResult,
        int $unmapped,
        bool $skipEmployeeMapping,
    ): string {
        $parts = [
            sprintf(
                '%d row(s) parsed (%s)',
                $parseResult['lines_parsed'],
                $parseResult['format'] === 'zk_attlog' ? 'ATTLOG' : 'CSV',
            ),
        ];

        if ($importResult['inserted'] > 0) {
            $parts[] = "{$importResult['inserted']} new punch(es) imported";
        }

        if ($importResult['duplicate'] > 0) {
            $parts[] = "{$importResult['duplicate']} duplicate(s) skipped";
        }

        if ($importResult['failed'] > 0) {
            $parts[] = "{$importResult['failed']} failed";
        }

        if ($parseResult['lines_skipped'] > 0) {
            $parts[] = "{$parseResult['lines_skipped']} row(s) could not be parsed";
        }

        if (! $skipEmployeeMapping && $unmapped > 0) {
            $parts[] = "{$unmapped} punch(es) need employee PIN mapping";
        }

        return implode('. ', $parts).'.';
    }
}
