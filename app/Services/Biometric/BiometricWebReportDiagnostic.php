<?php

namespace App\Services\Biometric;

use App\Enums\BiometricPunchDirection;
use App\Models\BiometricDevice;
use App\Models\BiometricPunch;
use Illuminate\Support\Carbon;
use Throwable;

final class BiometricWebReportDiagnostic
{
    public function __construct(
        private readonly ZkDeviceWebReportClient $client,
        private readonly ZkDeviceWebReportHtmlParser $parser,
        private readonly BiometricPunchImporter $importer,
        private readonly BiometricPipelineTracer $tracer,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function run(BiometricDevice $device, ?string $fromDate = null, ?string $toDate = null, bool $runBypassInsert = true): array
    {
        $this->tracer->reset();

        $timezone = $device->timezone;
        $from = Carbon::parse($fromDate ?? now($timezone)->subDays(7)->format('Y-m-d'), $timezone)->startOfDay()->utc();
        $until = Carbon::parse($toDate ?? now($timezone)->format('Y-m-d'), $timezone)->endOfDay()->utc();

        $result = [
            'login' => 'FAIL',
            'session' => 'FAIL',
            'users' => 0,
            'report_type' => 'unknown',
            'report_http_status' => null,
            'report_length' => 0,
            'report_rows' => 0,
            'parsed_punches' => 0,
            'in_range_punches' => 0,
            'saved' => 0,
            'bypass_insert' => 'SKIP',
            'error' => null,
        ];

        try {
            $this->client->testLogin($device);
            $result['login'] = 'OK';
            $session = $this->client->lastSessionIdUsed();
            $result['session'] = $session !== null ? 'OK ('.$session.')' : 'OPTIONAL (none)';
        } catch (Throwable $exception) {
            $result['error'] = $exception->getMessage();

            return $result;
        }

        try {
            $fetch = $this->client->fetchReportForDiagnostics($device, $from, $until);
            $result['users'] = $fetch['user_count'];
            $result['report_type'] = $fetch['report_type'];
            $result['report_http_status'] = $fetch['http_status'];
            $result['report_length'] = $fetch['html_length'];
            $result['report_rows'] = $fetch['data_row_count'];

            $parseResult = $this->parser->parseWithDiagnostics($fetch['html'], $timezone);
            $this->tracer->log('PARSER '.$parseResult->logLine());

            $result['parsed_punches'] = count($parseResult->punches);

            $inRange = array_values(array_filter(
                $parseResult->punches,
                fn (BiometricPunchData $punch): bool => $punch->punchedAt->between($from, $until),
            ));
            $result['in_range_punches'] = count($inRange);

            if ($inRange !== []) {
                $import = $this->importer->import($device, $inRange, $this->tracer);
                $result['saved'] = $import['inserted'];
            }
        } catch (Throwable $exception) {
            $result['error'] = $exception->getMessage();
        }

        if ($runBypassInsert) {
            $result['bypass_insert'] = $this->runBypassInsertTest($device);
        }

        return $result;
    }

    private function runBypassInsertTest(BiometricDevice $device): string
    {
        $punch = new BiometricPunchData(
            deviceUserId: 'DEBUG_BYPASS',
            punchedAt: \Illuminate\Support\Carbon::now()->utc(),
            direction: BiometricPunchDirection::In,
            rawPayload: ['source' => 'biometric_debug_bypass'],
            rawStatus: 0,
        );

        try {
            $import = $this->importer->import($device, [$punch], $this->tracer);

            if ($import['inserted'] === 1) {
                BiometricPunch::query()
                    ->where('biometric_device_id', $device->id)
                    ->where('device_user_id', 'DEBUG_BYPASS')
                    ->delete();

                return 'OK (inserted then removed)';
            }

            if ($import['duplicate'] === 1) {
                return 'OK (duplicate key — DB pipeline works)';
            }

            if ($import['failed'] > 0) {
                return 'FAIL (insert failed)';
            }

            return 'FAIL (no row written)';
        } catch (Throwable $exception) {
            return 'FAIL: '.$exception->getMessage();
        }
    }
}
