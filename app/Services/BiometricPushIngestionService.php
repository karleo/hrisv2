<?php

namespace App\Services;

use App\Models\BiometricPushRecord;
use App\Models\BiometricSetting;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class BiometricPushIngestionService
{
    public function __construct(
        private readonly BiometricPunchPairingService $pairingService
    ) {}

    /**
     * @return array{received: int, processed: int, skipped: int}
     */
    public function ingest(Request $request): array
    {
        $settings = BiometricSetting::current();
        $deviceSerial = $this->extractDeviceSerial($request);
        $rawPunches = $this->parseRawPunches($request, $settings->timezone);
        $received = count($rawPunches);

        $newPunches = [];

        foreach ($rawPunches as $row) {
            $fingerprint = sha1(
                implode('|', [
                    (string) ($deviceSerial ?? ''),
                    $row['employee_identifier'],
                    $row['punched_at']->toIso8601String(),
                    $row['raw_line'],
                ])
            );

            $exists = BiometricPushRecord::query()->where('fingerprint', $fingerprint)->exists();
            if ($exists) {
                continue;
            }

            BiometricPushRecord::query()->create([
                'fingerprint' => $fingerprint,
                'device_serial' => $deviceSerial,
                'employee_identifier' => $row['employee_identifier'],
                'punched_at' => $row['punched_at']->setTimezone(config('app.timezone')),
                'raw_line' => $row['raw_line'],
            ]);

            $newPunches[] = [
                'log_id' => $fingerprint,
                'employee_identifier' => $row['employee_identifier'],
                'punched_at' => $row['punched_at'],
                'event' => 'punch',
            ];
        }

        $pairing = $this->pairingService->applyPunches($settings, $newPunches);
        $settings->forceFill([
            'last_polled_at' => now(),
        ])->save();

        Log::info('Biometric push ingested.', [
            'received' => $received,
            'processed' => $pairing['processed'],
            'skipped' => $pairing['skipped'],
            'device_serial' => $deviceSerial,
        ]);

        return [
            'received' => $received,
            'processed' => $pairing['processed'],
            'skipped' => $pairing['skipped'],
        ];
    }

    private function extractDeviceSerial(Request $request): ?string
    {
        $serial = $request->query('SN')
            ?? $request->input('SN')
            ?? $request->header('X-ZKTeco-Serial');

        if (! is_string($serial)) {
            return null;
        }

        $serial = trim($serial);

        return $serial === '' ? null : $serial;
    }

    /**
     * @return list<array{employee_identifier: string, punched_at: CarbonImmutable, raw_line: string}>
     */
    private function parseRawPunches(Request $request, string $timezone): array
    {
        $body = trim((string) $request->getContent());
        if ($body === '') {
            return [];
        }

        $lines = preg_split('/\r\n|\r|\n/', $body) ?: [];
        $rows = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            $parsed = $this->parseAdmsLine($line);
            if ($parsed === null) {
                continue;
            }

            $rows[] = [
                'employee_identifier' => $parsed['employee_identifier'],
                'punched_at' => CarbonImmutable::parse($parsed['punched_at'], $timezone),
                'raw_line' => $line,
            ];
        }

        if ($rows !== []) {
            return $rows;
        }

        $json = $request->json()->all();
        if (! is_array($json)) {
            return [];
        }

        $items = Arr::wrap($json['logs'] ?? $json['data'] ?? []);
        $rows = [];
        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $pin = trim((string) ($item['pin'] ?? $item['user_id'] ?? ''));
            $time = trim((string) ($item['time'] ?? $item['datetime'] ?? ''));
            if ($pin === '' || $time === '') {
                continue;
            }

            $rows[] = [
                'employee_identifier' => $pin,
                'punched_at' => CarbonImmutable::parse($time, $timezone),
                'raw_line' => json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '',
            ];
        }

        return $rows;
    }

    /**
     * Parse common ADMS line formats:
     * - "PIN\t2026-04-17 08:00:00\t1\t0\t0"
     * - "PIN=EMP-0001\tDateTime=2026-04-17 08:00:00\tStatus=0"
     *
     * @return array{employee_identifier: string, punched_at: string}|null
     */
    private function parseAdmsLine(string $line): ?array
    {
        $parts = preg_split('/\t+/', $line) ?: [];
        if (count($parts) >= 2 && ! str_contains($parts[0], '=')) {
            $pin = trim((string) ($parts[0] ?? ''));
            $time = trim((string) ($parts[1] ?? ''));
            if ($pin !== '' && $time !== '') {
                return [
                    'employee_identifier' => $pin,
                    'punched_at' => $time,
                ];
            }
        }

        $kv = [];
        foreach ($parts as $part) {
            if (! str_contains($part, '=')) {
                continue;
            }
            [$k, $v] = array_pad(explode('=', $part, 2), 2, '');
            $kv[strtolower(trim($k))] = trim($v);
        }

        $pin = $kv['pin'] ?? $kv['userid'] ?? $kv['user_id'] ?? null;
        $time = $kv['datetime'] ?? $kv['time'] ?? null;
        if (! is_string($pin) || ! is_string($time)) {
            return null;
        }
        if (trim($pin) === '' || trim($time) === '') {
            return null;
        }

        return [
            'employee_identifier' => trim($pin),
            'punched_at' => trim($time),
        ];
    }
}
