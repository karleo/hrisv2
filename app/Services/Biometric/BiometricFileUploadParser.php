<?php

namespace App\Services\Biometric;

use App\Enums\BiometricPunchDirection;
use App\Models\BiometricDevice;
use RuntimeException;

final class BiometricFileUploadParser
{
    public function __construct(
        private readonly IclockAdmsAttendanceParser $admsParser,
    ) {}

    /**
     * @return array{
     *     punches: list<BiometricPunchData>,
     *     format: string,
     *     lines_total: int,
     *     lines_parsed: int,
     *     lines_skipped: int,
     * }
     */
    public function parse(BiometricDevice $device, string $contents, ?string $formatHint = null): array
    {
        $contents = trim($contents);

        if ($contents === '') {
            throw new RuntimeException('The uploaded file is empty.');
        }

        $format = $formatHint ?? $this->detectFormat($contents);

        return match ($format) {
            'zk_attlog' => $this->parseAttlog($device, $contents),
            'zk_csv' => $this->parseCsv($device, $contents),
            default => throw new RuntimeException('Unsupported file format.'),
        };
    }

    /**
     * @return array<string, string>
     */
    public function supportedFormats(): array
    {
        return [
            'zk_attlog' => 'ZKTeco ATTLOG (tab-separated .txt / .dat)',
            'zk_csv' => 'ZKTeco / ZKBioTime CSV export',
        ];
    }

    private function detectFormat(string $contents): string
    {
        $firstLine = trim(strtok($contents, "\r\n") ?: '');

        if ($firstLine === '') {
            throw new RuntimeException('The uploaded file is empty.');
        }

        if ($this->looksLikeAttlogLine($firstLine)) {
            return 'zk_attlog';
        }

        if ($this->looksLikeCsvHeader($firstLine)) {
            return 'zk_csv';
        }

        $secondLine = trim(strtok("\n") ?: '');

        if ($secondLine !== '' && $this->looksLikeAttlogLine($secondLine)) {
            return 'zk_attlog';
        }

        if ($this->looksLikeCsvHeader($firstLine) || str_contains($firstLine, ',')) {
            return 'zk_csv';
        }

        throw new RuntimeException(
            'Could not detect file format. Use ZKTeco ATTLOG (.txt/.dat) or a CSV export with PIN and date/time columns.',
        );
    }

    /**
     * @return array{
     *     punches: list<BiometricPunchData>,
     *     format: string,
     *     lines_total: int,
     *     lines_parsed: int,
     *     lines_skipped: int,
     * }
     */
    private function parseAttlog(BiometricDevice $device, string $contents): array
    {
        $lines = preg_split("/\r\n|\n|\r/", $contents) ?: [];
        $punches = [];
        $linesTotal = 0;
        $linesSkipped = 0;

        foreach ($lines as $line) {
            $line = trim($line);

            if ($line === '') {
                continue;
            }

            $linesTotal++;
            $punch = $this->admsParser->parseLine($device, $line);

            if ($punch === null) {
                $linesSkipped++;

                continue;
            }

            $punches[] = $punch;
        }

        return [
            'punches' => $punches,
            'format' => 'zk_attlog',
            'lines_total' => $linesTotal,
            'lines_parsed' => count($punches),
            'lines_skipped' => $linesSkipped,
        ];
    }

    /**
     * @return array{
     *     punches: list<BiometricPunchData>,
     *     format: string,
     *     lines_total: int,
     *     lines_parsed: int,
     *     lines_skipped: int,
     * }
     */
    private function parseCsv(BiometricDevice $device, string $contents): array
    {
        $handle = fopen('php://memory', 'rb+');

        if ($handle === false) {
            throw new RuntimeException('Unable to read the uploaded file.');
        }

        fwrite($handle, $contents);
        rewind($handle);

        $delimiter = $this->detectCsvDelimiter($contents);
        $headerRow = fgetcsv($handle, 0, $delimiter);

        if (! is_array($headerRow) || $headerRow === []) {
            fclose($handle);

            throw new RuntimeException('The CSV file has no header row.');
        }

        $headers = array_map(fn ($value): string => $this->normalizeHeader((string) $value), $headerRow);
        $layout = $this->detectCsvLayout($headers);

        if ($layout === null) {
            fclose($handle);

            throw new RuntimeException(
                'CSV headers must include a user PIN column and a date/time column (e.g. User ID, Date, Time).',
            );
        }

        $punches = [];
        $linesTotal = 0;
        $linesSkipped = 0;

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($row === [null] || $row === []) {
                continue;
            }

            $linesTotal++;
            $punch = $this->parseCsvRow($device, $row, $layout);

            if ($punch === null) {
                $linesSkipped++;

                continue;
            }

            $punches[] = $punch;
        }

        fclose($handle);

        return [
            'punches' => $punches,
            'format' => 'zk_csv',
            'lines_total' => $linesTotal,
            'lines_parsed' => count($punches),
            'lines_skipped' => $linesSkipped,
        ];
    }

    /**
     * @param  list<string>  $headers
     * @return array{
     *     pin_index: int,
     *     date_index: ?int,
     *     time_index: ?int,
     *     datetime_index: ?int,
     *     status_index: ?int,
     * }|null
     */
    private function detectCsvLayout(array $headers): ?array
    {
        $pinIndex = null;
        $dateIndex = null;
        $timeIndex = null;
        $datetimeIndex = null;
        $statusIndex = null;

        foreach ($headers as $index => $header) {
            if ($pinIndex === null && $this->isPinHeader($header)) {
                $pinIndex = $index;
            }

            if ($dateIndex === null && in_array($header, ['date', 'att date', 'attendance date'], true)) {
                $dateIndex = $index;
            }

            if ($timeIndex === null && in_array($header, ['time', 'att time', 'attendance time', 'punch time'], true)) {
                $timeIndex = $index;
            }

            if ($datetimeIndex === null && (
                in_array($header, ['datetime', 'date time', 'timestamp', 'punch datetime', 'check time'], true)
                || str_contains($header, 'date time')
                || str_contains($header, 'punch time')
            )) {
                $datetimeIndex = $index;
            }

            if ($statusIndex === null && (
                in_array($header, ['state', 'status', 'in/out', 'check type', 'punch state', 'att state'], true)
                || str_contains($header, 'check type')
                || str_contains($header, 'in/out')
            )) {
                $statusIndex = $index;
            }
        }

        if ($pinIndex === null) {
            return null;
        }

        if ($datetimeIndex === null && ($dateIndex === null || $timeIndex === null)) {
            return null;
        }

        return [
            'pin_index' => $pinIndex,
            'date_index' => $dateIndex,
            'time_index' => $timeIndex,
            'datetime_index' => $datetimeIndex,
            'status_index' => $statusIndex,
        ];
    }

    /**
     * @param  list<string|null>  $row
     * @param  array{
     *     pin_index: int,
     *     date_index: ?int,
     *     time_index: ?int,
     *     datetime_index: ?int,
     *     status_index: ?int,
     * }  $layout
     */
    private function parseCsvRow(BiometricDevice $device, array $row, array $layout): ?BiometricPunchData
    {
        $deviceUserId = trim((string) ($row[$layout['pin_index']] ?? ''));

        if ($deviceUserId === '') {
            return null;
        }

        $timestampRaw = '';

        if ($layout['datetime_index'] !== null) {
            $timestampRaw = trim((string) ($row[$layout['datetime_index']] ?? ''));
        } else {
            $date = trim((string) ($row[$layout['date_index']] ?? ''));
            $time = trim((string) ($row[$layout['time_index']] ?? ''));

            if ($date === '' || $time === '') {
                return null;
            }

            $timestampRaw = BiometricPunchClock::normalizeWallClock($date, $time);
        }

        if ($timestampRaw === '') {
            return null;
        }

        $punchedAtStorage = BiometricPunchClock::storageFromDeviceTimestamp($timestampRaw, $device->timezone);
        $statusRaw = $layout['status_index'] !== null
            ? trim((string) ($row[$layout['status_index']] ?? ''))
            : '';

        $direction = $this->directionFromStatus($statusRaw);
        $rawStatus = match ($direction) {
            BiometricPunchDirection::In => 0,
            BiometricPunchDirection::Out => 1,
            default => is_numeric($statusRaw) ? (int) $statusRaw : null,
        };

        return BiometricPunchData::fromDeviceWallClock(
            deviceUserId: $deviceUserId,
            punchedAtStorage: $punchedAtStorage,
            timezone: $device->timezone,
            direction: $direction,
            rawPayload: [
                'source' => 'file_upload',
                'format' => 'zk_csv',
                'row' => $row,
                'status' => $statusRaw,
            ],
            rawStatus: $rawStatus,
        );
    }

    private function directionFromStatus(string $status): BiometricPunchDirection
    {
        $normalized = strtolower(trim($status));

        if ($normalized === '') {
            return BiometricPunchDirection::Unknown;
        }

        if (in_array($normalized, ['0', 'in', 'check-in', 'check in', 'clock in', 'clock-in'], true)
            || str_contains($normalized, 'check-in')
            || str_contains($normalized, 'clock in')) {
            return BiometricPunchDirection::In;
        }

        if (in_array($normalized, ['1', 'out', 'check-out', 'check out', 'clock out', 'clock-out'], true)
            || str_contains($normalized, 'check-out')
            || str_contains($normalized, 'clock out')) {
            return BiometricPunchDirection::Out;
        }

        return BiometricPunchDirection::Unknown;
    }

    private function looksLikeAttlogLine(string $line): bool
    {
        return preg_match('/^\d+\t\d{4}[-\/]\d{2}[-\/]\d{2}/', $line) === 1
            || preg_match('/^\d+\t\d{1,2}:\d{2}/', $line) === 1;
    }

    private function looksLikeCsvHeader(string $line): bool
    {
        if (! str_contains($line, ',') && ! str_contains($line, ';')) {
            return false;
        }

        $normalized = strtolower($line);

        return str_contains($normalized, 'pin')
            || str_contains($normalized, 'user id')
            || str_contains($normalized, 'userid')
            || str_contains($normalized, 'id number')
            || str_contains($normalized, 'employee id')
            || str_contains($normalized, 'enroll');
    }

    private function detectCsvDelimiter(string $contents): string
    {
        $firstLine = trim(strtok($contents, "\r\n") ?: '');

        if ($firstLine === '') {
            return ',';
        }

        $commaCount = substr_count($firstLine, ',');
        $semicolonCount = substr_count($firstLine, ';');

        return $semicolonCount > $commaCount ? ';' : ',';
    }

    private function normalizeHeader(string $header): string
    {
        $header = trim($header);

        if (str_starts_with($header, "\xEF\xBB\xBF")) {
            $header = substr($header, 3);
        }

        return strtolower(trim($header));
    }

    private function isPinHeader(string $normalized): bool
    {
        return in_array($normalized, [
            'pin',
            'userid',
            'user id',
            'id number',
            'id no',
            'id',
            'employee id',
            'enroll number',
            'enroll no',
            'badge number',
        ], true)
            || str_contains($normalized, 'id number')
            || str_contains($normalized, 'user id')
            || str_contains($normalized, 'enroll');
    }
}
