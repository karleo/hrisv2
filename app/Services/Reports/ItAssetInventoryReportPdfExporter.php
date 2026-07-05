<?php

namespace App\Services\Reports;

use App\Enums\ItAssetCategory;
use App\Models\CompanyProfile;
use App\Models\Employee;
use App\Models\Hardware;
use App\Support\PublicStorageUrl;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

final class ItAssetInventoryReportPdfExporter
{
    private const ROWS_ON_FIRST_PAGE = 16;

    private const ROWS_ON_OTHER_PAGES = 22;

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  array{total_assets: int, total_value: float}  $summary
     */
    public function download(
        array $rows,
        ?string $from,
        ?string $to,
        ?ItAssetCategory $category,
        ?int $hardwareId,
        ?Employee $employee,
        array $summary,
    ): HttpResponse {
        $filename = $this->filename($from, $to);

        $company = CompanyProfile::query()
            ->orderBy('id')
            ->first(['id', 'company_name', 'logo']);

        $prepared = $this->prepareRowsForPdf($rows);
        $pages = $this->paginateRows($prepared);
        $totalPages = max(1, count($pages));

        return Pdf::loadView('reports.it-asset-inventory-report-pdf', [
            'pages' => $pages,
            'totalPages' => $totalPages,
            'from' => $from !== null ? $this->formatPdfDate($from) : null,
            'to' => $to !== null ? $this->formatPdfDate($to) : null,
            'categoryLabel' => $category?->label(),
            'hardwareLabel' => $hardwareId !== null
                ? Hardware::query()->whereKey($hardwareId)->value('name')
                : null,
            'employeeLabel' => $employee !== null
                ? trim($employee->first_name.' '.$employee->last_name)
                : null,
            'companyName' => $company?->company_name ?? config('app.name'),
            'companyLogoDataUri' => PublicStorageUrl::dataUriForPath($company?->logo),
            'generatedAt' => now()->format('d/m/Y H:i:s'),
            'totalAssets' => $summary['total_assets'],
            'totalValue' => $summary['total_value'] > 0
                ? number_format($summary['total_value'], 2)
                : null,
        ])
            ->setPaper('a4', 'landscape')
            ->download($filename);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function prepareRowsForPdf(array $rows): array
    {
        $prepared = [];

        foreach ($rows as $index => $row) {
            $prepared[] = array_merge($row, [
                'series_number' => $index + 1,
                'purchase_date' => isset($row['purchase_date'])
                    ? $this->formatPdfDate((string) $row['purchase_date'])
                    : '—',
                'asset_value_display' => $row['asset_value'] !== null
                    ? number_format((float) $row['asset_value'], 2)
                        .($row['asset_currency'] ? ' '.$row['asset_currency'] : '')
                    : '—',
            ]);
        }

        return $prepared;
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

    private function filename(?string $from, ?string $to): string
    {
        if ($from !== null && $to !== null) {
            return 'it-asset-inventory-'.$from.'-to-'.$to.'.pdf';
        }

        return 'it-asset-inventory-'.now()->format('Y-m-d').'.pdf';
    }

    private function formatPdfDate(string $value): string
    {
        try {
            return Carbon::parse($value)->format('d/m/Y');
        } catch (\Throwable) {
            return $value;
        }
    }
}
