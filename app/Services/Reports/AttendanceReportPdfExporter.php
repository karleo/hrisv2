<?php

namespace App\Services\Reports;

use App\Models\BiometricDevice;
use App\Models\CompanyProfile;
use App\Models\Employee;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

final class AttendanceReportPdfExporter
{
    /** Fits below the report header on A4 landscape in DomPDF without splitting the table. */
    private const ROWS_ON_FIRST_PAGE = 14;

    private const ROWS_ON_OTHER_PAGES = 19;

    /**
     * @param  list<array{
     *     date: string,
     *     employee_name: string,
     *     employee_code: string|null,
     *     device_pin: string,
     *     device_name: string|null,
     *     clock_in: string|null,
     *     clock_out: string|null,
     *     punch_count: int,
     *     working_hours: string,
     *     overtime: string,
     * }>  $rows
     */
    public function download(
        array $rows,
        string $from,
        string $to,
        ?Employee $employee = null,
        ?int $deviceId = null,
    ): HttpResponse {
        $filename = $this->filename($from, $to, $employee);

        $employeeLabel = null;
        $company = null;

        if ($employee !== null) {
            $employee->loadMissing('companyProfile:id,company_name,logo');
            $employeeLabel = trim($employee->first_name.' '.$employee->last_name);
            $company = $employee->companyProfile;
        }

        if ($company === null) {
            $company = CompanyProfile::query()
                ->orderBy('id')
                ->first(['id', 'company_name', 'logo']);
        }

        $deviceLabel = null;
        if ($deviceId !== null) {
            $deviceLabel = BiometricDevice::query()->whereKey($deviceId)->value('name');
        }

        $prepared = $this->prepareRowsForPdf($rows);
        $pages = $this->paginateRows($prepared['rows']);
        $totalPages = max(1, count($pages));

        return Pdf::loadView('reports.attendance-report-pdf', [
            'pages' => $pages,
            'totalPages' => $totalPages,
            'from' => $this->formatPdfDate($from),
            'to' => $this->formatPdfDate($to),
            'employeeLabel' => $employeeLabel,
            'deviceLabel' => $deviceLabel,
            'companyName' => $company?->company_name ?? config('app.name'),
            'companyLogoDataUri' => $this->storageImageDataUri($company?->logo),
            'generatedAt' => now()->format('d/m/Y H:i:s'),
            'totalOvertime' => $prepared['total_overtime'],
        ])
            ->setPaper('a4', 'landscape')
            ->download($filename);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<list<array<string, mixed>>>
     */
    private function paginateRows(array $rows): array
    {
        if ($rows === []) {
            return [[]];
        }

        $pages = [
            array_slice($rows, 0, self::ROWS_ON_FIRST_PAGE),
        ];
        $offset = self::ROWS_ON_FIRST_PAGE;

        while ($offset < count($rows)) {
            $pages[] = array_slice($rows, $offset, self::ROWS_ON_OTHER_PAGES);
            $offset += self::ROWS_ON_OTHER_PAGES;
        }

        return $pages;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array{rows: list<array<string, mixed>>, total_overtime: string|null}
     */
    private function prepareRowsForPdf(array $rows): array
    {
        $totalOvertimeMinutes = 0;
        $hasOvertimeData = false;
        $preparedRows = [];

        foreach ($rows as $index => $row) {
            $dateKey = $row['date'];

            if (isset($row['overtime_minutes']) && $row['overtime_minutes'] !== null) {
                $totalOvertimeMinutes += (int) $row['overtime_minutes'];
                $hasOvertimeData = true;
            }

            $preparedRows[] = array_merge($row, [
                'date' => $this->formatPdfDate($dateKey),
                'day_name' => $this->dayNameFromDate($dateKey),
                'series_number' => $index + 1,
            ]);
        }

        return [
            'rows' => $preparedRows,
            'total_overtime' => $hasOvertimeData
                ? $this->formatOvertimeTotal($totalOvertimeMinutes)
                : null,
        ];
    }

    private function dayNameFromDate(string $date): string
    {
        try {
            return Carbon::parse($date)->format('l');
        } catch (\Throwable) {
            return '—';
        }
    }

    private function formatOvertimeTotal(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $remainder = $minutes % 60;

        return sprintf('%d:%02d', $hours, $remainder);
    }

    private function filename(string $from, string $to, ?Employee $employee): string
    {
        if ($employee !== null && $employee->employee_code !== '') {
            return 'attendance-'.$employee->employee_code.'-'.$from.'-to-'.$to.'.pdf';
        }

        return 'attendance-report-'.$from.'-to-'.$to.'.pdf';
    }

    private function formatPdfDate(string $value): string
    {
        try {
            return Carbon::parse($value)->format('d/m/Y');
        } catch (\Throwable) {
            return $value;
        }
    }

    private function storageImageDataUri(?string $storagePath): ?string
    {
        if ($storagePath === null || trim($storagePath) === '') {
            return null;
        }

        $relativePath = ltrim($storagePath, '/');

        if (! Storage::disk('public')->exists($relativePath)) {
            return null;
        }

        $fullPath = Storage::disk('public')->path($relativePath);
        $mime = mime_content_type($fullPath);

        if ($mime === false || ! str_starts_with($mime, 'image/')) {
            return null;
        }

        $contents = Storage::disk('public')->get($relativePath);

        if ($contents === null) {
            return null;
        }

        return 'data:'.$mime.';base64,'.base64_encode($contents);
    }
}
