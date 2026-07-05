<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\ItAssetInventoryReportRequest;
use App\Models\Employee;
use App\Models\Hardware;
use App\Services\Reports\ItAssetInventoryReportPdfExporter;
use App\Services\Reports\ItAssetInventoryReportService;
use App\Support\CompanyAccessScope;
use App\Support\RequestFormEmployeeSelection;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ItAssetInventoryReportController extends Controller
{
    public function __construct(
        private readonly CompanyAccessScope $companyScope,
        private readonly RequestFormEmployeeSelection $requestFormEmployees,
    ) {}

    public function index(
        ItAssetInventoryReportRequest $request,
        ItAssetInventoryReportService $reportService,
    ): InertiaResponse|StreamedResponse|HttpResponse {
        $validated = $request->validated();
        ['from' => $from, 'to' => $to] = $request->dateRange();

        $category = $request->categoryFilter();
        $hardwareId = isset($validated['hardware_id']) ? (int) $validated['hardware_id'] : null;
        $employeeId = isset($validated['employee_id']) ? (int) $validated['employee_id'] : null;
        $viewer = $request->user();
        $canChooseEmployee = $this->requestFormEmployees->canChooseEmployee($viewer);

        if (! $canChooseEmployee) {
            $viewer->loadMissing('employee');
            $ownEmployeeId = $viewer->employee?->id;

            if ($ownEmployeeId === null) {
                abort(403);
            }

            if ($employeeId !== null && $employeeId !== $ownEmployeeId) {
                abort(403);
            }

            $employeeId = $ownEmployeeId;
        } elseif ($employeeId !== null) {
            $employee = Employee::query()->find($employeeId);
            if ($employee === null || ! $this->companyScope->canAccessEmployee($viewer, $employee)) {
                abort(403);
            }
        }

        $report = $reportService->build($from, $to, $category, $hardwareId, $employeeId);

        if ($request->wantsCsvExport()) {
            return $this->csvResponse($report['rows'], $from, $to);
        }

        if ($request->wantsPdfExport()) {
            $employee = $employeeId !== null
                ? Employee::query()->find($employeeId)
                : null;

            return app(ItAssetInventoryReportPdfExporter::class)->download(
                rows: $report['rows'],
                from: $from,
                to: $to,
                category: $category,
                hardwareId: $hardwareId,
                employee: $employee,
                summary: [
                    'total_assets' => $report['total_assets'],
                    'total_value' => $report['total_value'],
                ],
            );
        }

        $page = max(1, (int) $request->input('page', 1));
        $perPage = 50;
        $collection = collect($report['rows']);
        $paginated = new LengthAwarePaginator(
            $collection->forPage($page, $perPage)->values()->all(),
            $collection->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        $employeeColumns = ['id', 'first_name', 'last_name', 'employee_code'];
        $employees = $canChooseEmployee
            ? $this->companyScope->scopedEmployeeQuery($viewer)
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get($employeeColumns)
            : $this->requestFormEmployees->employeesForForm($viewer, $employeeColumns);

        return Inertia::render('reports/it-asset-inventory', [
            'rows' => $paginated,
            'filters' => [
                'from' => $from ?? $request->input('from'),
                'to' => $to ?? $request->input('to'),
                'category' => $request->input('category'),
                'hardware_id' => $request->input('hardware_id'),
                'employee_id' => $employeeId !== null ? (string) $employeeId : $request->input('employee_id'),
            ],
            'summary' => [
                'total_assets' => $report['total_assets'],
                'total_value' => $report['total_value'],
            ],
            'employees' => $employees->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'name' => trim($employee->first_name.' '.$employee->last_name),
                'employee_code' => $employee->employee_code,
            ]),
            'hardwareTypes' => Hardware::query()->orderBy('name')->get(['id', 'name', 'code']),
            'categories' => collect(\App\Enums\ItAssetCategory::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ])->values(),
            'canChooseEmployee' => $canChooseEmployee,
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    private function csvResponse(array $rows, ?string $from, ?string $to): StreamedResponse
    {
        $filename = 'it-asset-inventory';
        if ($from !== null && $to !== null) {
            $filename .= '-'.$from.'-to-'.$to;
        }
        $filename .= '.csv';

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'Code',
                'Category',
                'Label',
                'Device type',
                'Serial / license',
                'Status',
                'Assigned employee',
                'Employee code',
                'Purchase date',
                'Value',
                'Currency',
                'Registered',
            ]);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['code'],
                    $row['category'],
                    $row['label'],
                    $row['device_type'],
                    $row['identifier'],
                    $row['status'],
                    $row['employee_name'],
                    $row['employee_code'] ?? '',
                    $row['purchase_date'] ?? '',
                    $row['asset_value'] !== null ? number_format((float) $row['asset_value'], 2, '.', '') : '',
                    $row['asset_currency'] ?? '',
                    $row['registered_at'] ?? '',
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
