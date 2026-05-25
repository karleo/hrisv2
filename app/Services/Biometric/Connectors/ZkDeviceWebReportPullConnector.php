<?php

namespace App\Services\Biometric\Connectors;

use App\Contracts\Biometric\BiometricDeviceConnector;
use App\Enums\BiometricConnectionType;
use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricPipelineTracer;
use App\Services\Biometric\ZkDeviceWebReportClient;
use Generator;
use Illuminate\Support\Carbon;
use RuntimeException;

final class ZkDeviceWebReportPullConnector implements BiometricDeviceConnector
{
    public function __construct(
        private readonly ZkDeviceWebReportClient $client,
        private readonly BiometricPipelineTracer $tracer,
    ) {}

    public function testConnection(BiometricDevice $device): bool
    {
        if ($device->connection_type !== BiometricConnectionType::DeviceWebReport) {
            throw new RuntimeException('Device is not configured for device web report pull.');
        }

        if ($device->host === null || $device->host === '') {
            throw new RuntimeException('Device host (IP) is required for web report pull.');
        }

        return $this->client->testLogin($device);
    }

    public function fetchAttendanceLogs(
        BiometricDevice $device,
        ?Carbon $since = null,
        ?Carbon $until = null,
    ): Generator {
        if ($device->connection_type !== BiometricConnectionType::DeviceWebReport) {
            throw new RuntimeException('Device is not configured for device web report pull.');
        }

        [$from, $to] = $this->resolveRange($device, $since, $until);

        $this->tracer->stage('connector_fetch_start', [
            'device_id' => $device->id,
            'from' => $from->toIso8601String(),
            'to' => $to->toIso8601String(),
        ]);

        $yielded = 0;

        foreach ($this->client->fetchPunches($device, $from, $to) as $punch) {
            $yielded++;
            yield $punch;
        }

        $this->tracer->stage('connector_fetch_done', ['punches_yielded' => $yielded]);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveRange(BiometricDevice $device, ?Carbon $since, ?Carbon $until): array
    {
        $timezone = $device->timezone;

        if ($since !== null && $until !== null) {
            return [$since, $until];
        }

        if ($since !== null) {
            return [
                $since,
                now($timezone)->endOfDay()->utc(),
            ];
        }

        $days = (int) config('biometric.device_web.default_range_days', 30);

        return [
            now($timezone)->subDays($days)->startOfDay()->utc(),
            now($timezone)->endOfDay()->utc(),
        ];
    }
}
