<?php

namespace BiometricRelay\Relay;

use Carbon\Carbon;
use PrimeLogistics\ZkBiometricClient\Attlog\CdataClient;
use PrimeLogistics\ZkBiometricClient\Device\DeviceConfig;
use PrimeLogistics\ZkBiometricClient\Punch\PunchRecord;
use PrimeLogistics\ZkBiometricClient\WebReport\WebReportClient;
use Throwable;

final class RelayRunner
{
    public function __construct(
        private readonly WebReportClient $webReport,
        private readonly CdataClient $cdata,
        private readonly WatermarkStore $watermarkStore,
        private readonly RetryQueue $retryQueue,
        private readonly AwsHealthClient $healthClient,
        private readonly RunLogger $logger,
        private readonly DeviceConfig $device,
        private readonly string $cdataUrl,
        private readonly int $chunkSize,
    ) {}

    /**
     * @return array{
     *     started_at: string,
     *     duration_ms: int,
     *     punches_pulled: int,
     *     punches_relayed: int,
     *     upload_duration_ms: int,
     *     failures: int,
     *     retry_count: int,
     *     status: string,
     *     errors: list<string>,
     *     aws_reachable: bool
     * }
     */
    public function run(): array
    {
        $startedAt = Carbon::now();
        $started = microtime(true);
        $errors = [];
        $pulled = 0;
        $relayed = 0;
        $failures = 0;
        $uploadMs = 0;

        $health = $this->healthClient->check();
        $awsReachable = $health['ok'];

        try {
            $watermark = $this->watermarkStore->watermark();
            $until = Carbon::now($this->device->timezone);

            $fresh = $this->webReport->fetchPunchesAfter($this->device, $watermark, $until);
            $pending = $this->retryQueue->all();
            $batch = $this->mergeUnique([...$pending, ...$fresh]);
            $pulled = count($fresh);

            if ($batch === []) {
                $summary = $this->finish(
                    startedAt: $startedAt,
                    started: $started,
                    pulled: 0,
                    relayed: 0,
                    uploadMs: 0,
                    failures: 0,
                    status: 'idle',
                    errors: [],
                    awsReachable: $awsReachable,
                    watermark: $watermark,
                );

                return $summary;
            }

            if (! $awsReachable) {
                $this->retryQueue->replace($batch);
                $failures = count($batch);
                $errors[] = 'AWS health check failed: '.$health['status'];

                return $this->finish(
                    startedAt: $startedAt,
                    started: $started,
                    pulled: $pulled,
                    relayed: 0,
                    uploadMs: 0,
                    failures: $failures,
                    status: 'queued_for_retry',
                    errors: $errors,
                    awsReachable: false,
                    watermark: $watermark,
                );
            }

            $uploadStarted = microtime(true);

            try {
                $relayed = $this->cdata->postPunchesOrFail(
                    $this->cdataUrl,
                    $this->device->serialNumber,
                    $batch,
                    $this->chunkSize,
                );
                $uploadMs = (int) round((microtime(true) - $uploadStarted) * 1000);
                $this->retryQueue->clear();

                $maxPunch = $this->maxPunchedAt($batch) ?? $watermark;

                return $this->finish(
                    startedAt: $startedAt,
                    started: $started,
                    pulled: $pulled,
                    relayed: $relayed,
                    uploadMs: $uploadMs,
                    failures: 0,
                    status: 'ok',
                    errors: [],
                    awsReachable: true,
                    watermark: $maxPunch,
                );
            } catch (Throwable $exception) {
                $uploadMs = (int) round((microtime(true) - $uploadStarted) * 1000);
                $this->retryQueue->replace($batch);
                $failures = count($batch);
                $errors[] = $exception->getMessage();

                return $this->finish(
                    startedAt: $startedAt,
                    started: $started,
                    pulled: $pulled,
                    relayed: 0,
                    uploadMs: $uploadMs,
                    failures: $failures,
                    status: 'upload_failed',
                    errors: $errors,
                    awsReachable: true,
                    watermark: $watermark,
                );
            }
        } catch (Throwable $exception) {
            $errors[] = $exception->getMessage();
            $this->logger->error('relay_run_failed', ['error' => $exception->getMessage()]);

            return $this->finish(
                startedAt: $startedAt,
                started: $started,
                pulled: $pulled,
                relayed: $relayed,
                uploadMs: $uploadMs,
                failures: max($failures, 1),
                status: 'error',
                errors: $errors,
                awsReachable: $awsReachable,
                watermark: $this->watermarkStore->watermark(),
            );
        }
    }

    /**
     * @param  list<string>  $errors
     * @return array{
     *     started_at: string,
     *     duration_ms: int,
     *     punches_pulled: int,
     *     punches_relayed: int,
     *     upload_duration_ms: int,
     *     failures: int,
     *     retry_count: int,
     *     status: string,
     *     errors: list<string>,
     *     aws_reachable: bool
     * }
     */
    private function finish(
        Carbon $startedAt,
        float $started,
        int $pulled,
        int $relayed,
        int $uploadMs,
        int $failures,
        string $status,
        array $errors,
        bool $awsReachable,
        ?string $watermark,
    ): array {
        $retryCount = $this->retryQueue->count();
        $summary = [
            'started_at' => $startedAt->toIso8601String(),
            'duration_ms' => (int) round((microtime(true) - $started) * 1000),
            'punches_pulled' => $pulled,
            'punches_relayed' => $relayed,
            'upload_duration_ms' => $uploadMs,
            'failures' => $failures,
            'retry_count' => $retryCount,
            'status' => $status,
            'errors' => $errors,
            'aws_reachable' => $awsReachable,
        ];

        $this->watermarkStore->write($watermark, $summary);
        $this->logger->runSummary($summary);

        $this->healthClient->heartbeat([
            'serial_number' => $this->device->serialNumber,
            'last_relay_at' => $summary['started_at'],
            'last_successful_upload_at' => $status === 'ok' ? Carbon::now()->toIso8601String() : null,
            'pending_retries' => $retryCount,
            'status' => $status,
            'punches_pulled' => $pulled,
            'punches_relayed' => $relayed,
            'failures' => $failures,
            'watermark' => $watermark,
        ]);

        return $summary;
    }

    /**
     * @param  list<PunchRecord>  $punches
     * @return list<PunchRecord>
     */
    private function mergeUnique(array $punches): array
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

    /**
     * @param  list<PunchRecord>  $punches
     */
    private function maxPunchedAt(array $punches): ?string
    {
        $max = null;

        foreach ($punches as $punch) {
            if ($max === null || $punch->punchedAtStorage > $max) {
                $max = $punch->punchedAtStorage;
            }
        }

        return $max;
    }
}
