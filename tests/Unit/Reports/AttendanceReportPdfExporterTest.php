<?php

namespace Tests\Unit\Reports;

use App\Services\Reports\AttendanceReportPdfExporter;
use Tests\TestCase;

class AttendanceReportPdfExporterTest extends TestCase
{
    public function test_pdf_view_renders_page_number_footer_for_multiple_pages(): void
    {
        $rows = [];

        for ($day = 1; $day <= 20; $day++) {
            $rows[] = [
                'date' => sprintf('2026-05-%02d', $day),
                'employee_code' => 'EMP-0009',
                'employee_name' => 'Ahamed Mansoor',
                'clock_in' => '09:00:00',
                'clock_out' => '18:00:00',
                'working_hours' => '8h 57m',
            ];
        }

        $html = view('reports.attendance-report-pdf', [
            'pages' => [
                array_slice($rows, 0, 14),
                array_slice($rows, 14),
            ],
            'totalPages' => 2,
            'from' => '10/05/2026',
            'to' => '09/06/2026',
            'employeeLabel' => 'Ahamed Mansoor',
            'deviceLabel' => null,
            'companyName' => 'Prime Logistics',
            'companyLogoDataUri' => null,
            'generatedAt' => '09/06/2026 11:40:07',
        ])->render();

        $this->assertStringContainsString('1-2', $html);
        $this->assertStringContainsString('2-2', $html);
    }

    public function test_paginate_splits_seventeen_rows_across_two_pages(): void
    {
        $exporter = new AttendanceReportPdfExporter;
        $rows = array_fill(0, 17, [
            'date' => '2026-05-01',
            'employee_name' => 'Ahamed Mansoor',
            'employee_code' => 'EMP-0009',
            'device_pin' => '1',
            'device_name' => 'Gate',
            'clock_in' => '09:00:00',
            'clock_out' => '18:00:00',
            'punch_count' => 2,
            'working_hours' => '8h 57m',
        ]);

        $method = new \ReflectionMethod(AttendanceReportPdfExporter::class, 'paginateRows');
        $method->setAccessible(true);

        /** @var list<list<array<string, mixed>>> $pages */
        $pages = $method->invoke($exporter, $rows);

        $this->assertCount(2, $pages);
        $this->assertCount(14, $pages[0]);
        $this->assertCount(3, $pages[1]);
    }

    public function test_pdf_view_renders_single_page_footer_when_empty(): void
    {
        $html = view('reports.attendance-report-pdf', [
            'pages' => [[]],
            'totalPages' => 1,
            'from' => '10/05/2026',
            'to' => '09/06/2026',
            'employeeLabel' => null,
            'deviceLabel' => null,
            'companyName' => 'Prime Logistics',
            'companyLogoDataUri' => null,
            'generatedAt' => '09/06/2026 11:40:07',
        ])->render();

        $this->assertStringContainsString('1-1', $html);
    }
}
