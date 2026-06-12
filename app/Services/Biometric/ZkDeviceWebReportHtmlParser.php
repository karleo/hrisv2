<?php

namespace App\Services\Biometric;

use App\Enums\BiometricPunchDirection;
use DOMDocument;
use DOMElement;
use DOMNodeList;
use DOMXPath;
use RuntimeException;

/**
 * Parses attendance rows from the ZKTeco iClock web report (/csl/report).
 */
final class ZkDeviceWebReportHtmlParser
{
    /**
     * @return list<BiometricPunchData>
     */
    public function parse(string $html, string $timezone): array
    {
        return $this->parseWithDiagnostics($html, $timezone)->punches;
    }

    public function parseWithDiagnostics(string $html, string $timezone): ZkDeviceWebReportParseResult
    {
        $document = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        $loaded = $document->loadHTML($html, LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if (! $loaded) {
            throw new RuntimeException('Could not parse device report HTML.');
        }

        $xpath = new DOMXPath($document);
        /** @var DOMNodeList<DOMElement> $tables */
        $tables = $xpath->query('//table');

        $rowsScanned = 0;
        $dataRows = 0;

        foreach ($tables as $table) {
            $result = $this->parseTableWithStats($table, $timezone);

            if ($result['punches'] !== []) {
                return new ZkDeviceWebReportParseResult(
                    punches: $result['punches'],
                    tableFound: true,
                    rowsScanned: $result['rows_scanned'],
                    dataRows: $result['data_rows'],
                    layout: $result['layout'],
                );
            }

            $rowsScanned += $result['rows_scanned'];
            $dataRows += $result['data_rows'];
        }

        return new ZkDeviceWebReportParseResult(
            punches: [],
            tableFound: $rowsScanned > 0,
            rowsScanned: $rowsScanned,
            dataRows: $dataRows,
            layout: null,
        );
    }

    /**
     * @return array{punches: list<BiometricPunchData>, rows_scanned: int, data_rows: int, layout: ?string}
     */
    private function parseTableWithStats(DOMElement $table, string $timezone): array
    {
        $rows = $table->getElementsByTagName('tr');
        $rowsScanned = max(0, $rows->length - 1);

        if ($rows->length < 2) {
            return ['punches' => [], 'rows_scanned' => $rowsScanned, 'data_rows' => 0, 'layout' => null];
        }

        $headerCells = $this->rowCells($rows->item(0));

        if ($headerCells === []) {
            return ['punches' => [], 'rows_scanned' => $rowsScanned, 'data_rows' => 0, 'layout' => null];
        }

        $gridLayout = $this->detectGridLayout($headerCells);

        if ($gridLayout !== null) {
            return [
                'punches' => $this->parseGridLayout($rows, $gridLayout, $timezone),
                'rows_scanned' => $rowsScanned,
                'data_rows' => $this->countDataRows($rows, fn (array $cells): bool => $this->cellValue($cells, $gridLayout['date_index']) !== null
                    && $this->looksLikeDate((string) $this->cellValue($cells, $gridLayout['date_index'])),
                ),
                'layout' => 'date_id_in_out',
            ];
        }

        $eventLayout = $this->detectEventLayout($headerCells);

        if ($eventLayout !== null) {
            return [
                'punches' => $this->parseEventLayout($rows, $eventLayout, $timezone),
                'rows_scanned' => $rowsScanned,
                'data_rows' => $this->countDataRows($rows, fn (array $cells): bool => $this->cellValue($cells, $eventLayout['pin_index']) !== null
                    && ($this->resolveEventStorageTimestamp((string) ($this->cellValue($cells, $eventLayout['timestamp_index']) ?? ''), $timezone) !== ''
                        || $this->cellValue($cells, $eventLayout['timestamp_index']) !== null),
                ),
                'layout' => $eventLayout['layout_name'],
            ];
        }

        return ['punches' => [], 'rows_scanned' => $rowsScanned, 'data_rows' => 0, 'layout' => null];
    }

    /**
     * @param  list<string>  $headers
     * @return array{date_index: int, id_index: int, time_columns: array<int, BiometricPunchDirection>}|null
     */
    private function detectGridLayout(array $headers): ?array
    {
        $dateIndex = null;
        $idIndex = null;
        /** @var array<int, BiometricPunchDirection> $timeColumns */
        $timeColumns = [];

        foreach ($headers as $index => $header) {
            $normalized = $this->normalizeHeader($header);

            if ($dateIndex === null && (str_contains($normalized, 'date') || $normalized === 'day')) {
                $dateIndex = $index;

                continue;
            }

            if ($idIndex === null && $this->isPinHeader($normalized)) {
                $idIndex = $index;

                continue;
            }

            if ($normalized === 'in' || str_starts_with($normalized, 'in ')) {
                $timeColumns[$index] = BiometricPunchDirection::In;

                continue;
            }

            if ($normalized === 'out' || str_starts_with($normalized, 'out ')) {
                $timeColumns[$index] = BiometricPunchDirection::Out;
            }
        }

        if ($dateIndex === null || $idIndex === null || $timeColumns === []) {
            return null;
        }

        return [
            'date_index' => $dateIndex,
            'id_index' => $idIndex,
            'time_columns' => $timeColumns,
        ];
    }

    /**
     * @param  list<string>  $headers
     * @return array{layout_name: string, pin_index: int, timestamp_index: int, state_index: ?int}|null
     */
    private function detectEventLayout(array $headers): ?array
    {
        $pinIndex = null;
        $timestampIndex = null;
        $stateIndex = null;

        foreach ($headers as $index => $header) {
            $normalized = $this->normalizeHeader($header);

            if ($pinIndex === null && $this->isPinHeader($normalized)) {
                $pinIndex = $index;

                continue;
            }

            if ($timestampIndex === null && (str_contains($normalized, 'time') || str_contains($normalized, 'timestamp'))) {
                $timestampIndex = $index;

                continue;
            }

            if ($stateIndex === null && (str_contains($normalized, 'state') || str_contains($normalized, 'status'))) {
                $stateIndex = $index;
            }
        }

        if ($pinIndex === null || $timestampIndex === null) {
            return null;
        }

        return [
            'layout_name' => $stateIndex !== null ? 'pin_timestamp_state' : 'pin_timestamp',
            'pin_index' => $pinIndex,
            'timestamp_index' => $timestampIndex,
            'state_index' => $stateIndex,
        ];
    }

    /**
     * @param  array{date_index: int, id_index: int, time_columns: array<int, BiometricPunchDirection>}  $layout
     * @return list<BiometricPunchData>
     */
    private function parseGridLayout(\DOMNodeList $rows, array $layout, string $timezone): array
    {
        $punches = [];

        for ($i = 1; $i < $rows->length; $i++) {
            $cells = $this->rowCells($rows->item($i));

            if ($cells === []) {
                continue;
            }

            $date = $this->cellValue($cells, $layout['date_index']);

            if ($date === null || ! $this->looksLikeDate($date)) {
                continue;
            }

            $deviceUserId = trim((string) $this->cellValue($cells, $layout['id_index']));

            if ($deviceUserId === '') {
                continue;
            }

            foreach ($layout['time_columns'] as $columnIndex => $direction) {
                $time = $this->cellValue($cells, $columnIndex);

                if ($time === null || $time === '' || $time === '—' || $time === '-') {
                    continue;
                }

                $punches[] = BiometricPunchData::fromDeviceWallClock(
                    deviceUserId: $deviceUserId,
                    punchedAtStorage: BiometricPunchClock::normalizeWallClock($date, $time),
                    direction: $direction,
                    timezone: $timezone,
                    rawPayload: [
                        'source' => 'device_web_report',
                        'layout' => 'date_id_in_out',
                        'date' => $date,
                        'time' => $time,
                    ],
                    rawStatus: $direction === BiometricPunchDirection::In ? 0 : 1,
                );
            }
        }

        return $punches;
    }

    /**
     * @param  array{layout_name: string, pin_index: int, timestamp_index: int, state_index: ?int}  $layout
     * @return list<BiometricPunchData>
     */
    private function parseEventLayout(\DOMNodeList $rows, array $layout, string $timezone): array
    {
        $punches = [];

        for ($i = 1; $i < $rows->length; $i++) {
            $cells = $this->rowCells($rows->item($i));

            if ($cells === []) {
                continue;
            }

            $pin = trim((string) $this->cellValue($cells, $layout['pin_index']));

            if ($pin === '') {
                continue;
            }

            $timestampRaw = trim((string) ($this->cellValue($cells, $layout['timestamp_index']) ?? ''));

            if ($timestampRaw === '') {
                continue;
            }

            $punchedAtStorage = $this->resolveEventStorageTimestamp($timestampRaw, $timezone);

            $stateRaw = $layout['state_index'] !== null
                ? trim((string) ($this->cellValue($cells, $layout['state_index']) ?? ''))
                : '';

            $direction = $this->directionFromState($stateRaw, $timestampRaw);

            $punches[] = BiometricPunchData::fromDeviceWallClock(
                deviceUserId: $pin,
                punchedAtStorage: $punchedAtStorage,
                direction: $direction,
                timezone: $timezone,
                rawPayload: [
                    'source' => 'device_web_report',
                    'layout' => $layout['layout_name'],
                    'timestamp' => $timestampRaw,
                    'state' => $stateRaw,
                ],
                rawStatus: $direction === BiometricPunchDirection::In ? 0 : 1,
            );
        }

        return $punches;
    }

    private function directionFromState(string $state, string $timestampFallback): BiometricPunchDirection
    {
        $normalized = strtolower(trim($state));

        if ($normalized !== '' && (str_contains($normalized, 'out') || str_contains($normalized, 'check-out') || $normalized === '1')) {
            return BiometricPunchDirection::Out;
        }

        if ($normalized !== '' && (str_contains($normalized, 'in') || str_contains($normalized, 'check-in') || $normalized === '0')) {
            return BiometricPunchDirection::In;
        }

        return str_contains(strtolower($timestampFallback), 'out')
            ? BiometricPunchDirection::Out
            : BiometricPunchDirection::In;
    }

    private function normalizeHeader(string $header): string
    {
        return strtolower(trim(html_entity_decode($header, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
    }

    private function isPinHeader(string $normalized): bool
    {
        return in_array($normalized, ['pin', 'userid', 'user id', 'id number', 'id no', 'id'], true)
            || str_contains($normalized, 'id number')
            || str_contains($normalized, 'user id');
    }

    /**
     * @param  callable(list<string>): bool  $isDataRow
     */
    private function countDataRows(\DOMNodeList $rows, callable $isDataRow): int
    {
        $count = 0;

        for ($i = 1; $i < $rows->length; $i++) {
            $cells = $this->rowCells($rows->item($i));

            if ($cells !== [] && $isDataRow($cells)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * @return list<string>
     */
    private function rowCells(?\DOMNode $row): array
    {
        if (! $row instanceof DOMElement) {
            return [];
        }

        $cells = [];

        foreach ($row->childNodes as $child) {
            if (! $child instanceof DOMElement) {
                continue;
            }

            if (! in_array(strtolower($child->nodeName), ['td', 'th'], true)) {
                continue;
            }

            $cells[] = trim(html_entity_decode($child->textContent ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }

        return $cells;
    }

    /**
     * @param  list<string>  $cells
     */
    private function cellValue(array $cells, int $index): ?string
    {
        return $cells[$index] ?? null;
    }

    private function looksLikeDate(string $value): bool
    {
        return preg_match('/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/', $value) === 1
            || preg_match('/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/', $value) === 1;
    }

    private function resolveEventStorageTimestamp(string $timestampRaw, string $timezone): string
    {
        $normalized = BiometricPunchClock::normalizeTimestamp($timestampRaw);

        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $normalized) === 1) {
            return $normalized;
        }

        return BiometricPunchClock::normalizeWallClock(
            now($timezone)->format('Y-m-d'),
            $timestampRaw,
        );
    }
}
