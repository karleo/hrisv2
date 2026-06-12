<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\AttendanceReportRequest;
use App\Models\BiometricDevice;
use App\Models\Employee;
use App\Services\Reports\AttendanceReportPdfExporter;
use App\Services\Reports\AttendanceReportService;
use App\Support\CompanyAccessScope;
use App\Support\RequestFormEmployeeSelection;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceReportController extends Controller
{
    public function __construct(
        private readonly CompanyAccessScope $companyScope,
        private readonly RequestFormEmployeeSelection $requestFormEmployees,
    ) {}

    public function index(
        AttendanceReportRequest $request,
        AttendanceReportService $reportService,
    ): InertiaResponse|StreamedResponse|HttpResponse {
        $validated = $request->validated();
        ['from' => $from, 'to' => $to] = $request->dateRange();

        $employeeId = isset($validated['employee_id']) ? (int) $validated['employee_id'] : null;
        $deviceId = isset($validated['biometric_device_id']) ? (int) $validated['biometric_device_id'] : null;
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

        $report = $reportService->build($from, $to, $employeeId, $deviceId, $viewer);

        if ($request->wantsCsvExport()) {
            return $this->csvResponse($report['rows'], $from, $to);
        }

        if ($request->wantsPdfExport()) {
            $employee = $employeeId !== null
                ? Employee::query()->find($employeeId)
                : null;

            return app(AttendanceReportPdfExporter::class)->download(
                rows: $report['rows'],
                from: $from,
                to: $to,
                employee: $employee,
                deviceId: $deviceId,
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

        $employeeColumns = ['id', 'first_name', 'last_name', 'employee_code', 'biometric_user_id'];
        $employees = $canChooseEmployee
            ? $this->companyScope->scopedEmployeeQuery($viewer)
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get($employeeColumns)
            : $this->requestFormEmployees->employeesForForm($viewer, $employeeColumns);

        return Inertia::render('reports/attendance-report', [
            'rows' => $paginated,
            'filters' => [
                'from' => $from,
                'to' => $to,
                'employee_id' => $employeeId !== null ? (string) $employeeId : $request->input('employee_id'),
                'biometric_device_id' => $request->input('biometric_device_id'),
            ],
            'summary' => [
                'total_days' => $collection->count(),
                'total_punches' => $report['total_punches'],
                'total_manual_entries' => $report['total_manual_entries'],
            ],
            'employees' => $employees->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'name' => trim($employee->first_name.' '.$employee->last_name),
                'employee_code' => $employee->employee_code,
                'biometric_user_id' => $employee->biometric_user_id,
            ]),
            'canChooseEmployee' => $canChooseEmployee,
            'devices' => BiometricDevice::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

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
     * }>  $rows
     */
    private function csvResponse(array $rows, string $from, string $to): StreamedResponse
    {
        $filename = 'attendance-report-'.$from.'-to-'.$to.'.csv';

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'Date',
                'Employee',
                'Employee code',
                'Device PIN',
                'Device',
                'Source',
                'Work mode',
                'Clock in',
                'Clock out',
                'Working hours',
                'Overtime',
                'Punch count',
                'Check-in remarks',
                'Check-out remarks',
                'Check-in photo URL',
                'Check-out photo URL',
                'Check-in location',
                'Check-out location',
            ]);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['date'],
                    $row['employee_name'],
                    $row['employee_code'] ?? '',
                    $row['device_pin'],
                    $row['device_name'] ?? '',
                    $row['source'] ?? 'biometric',
                    $row['work_mode_label'] ?? '',
                    $row['clock_in'] ?? '',
                    $row['clock_out'] ?? '',
                    $row['working_hours'],
                    $row['overtime'] ?? '—',
                    (string) $row['punch_count'],
                    $row['check_in_remarks'] ?? '',
                    $row['check_out_remarks'] ?? '',
                    $row['check_in_photo_url'] ?? '',
                    $row['check_out_photo_url'] ?? '',
                    isset($row['check_in_latitude'], $row['check_in_longitude'])
                        ? $row['check_in_latitude'].','.$row['check_in_longitude']
                        : '',
                    isset($row['check_out_latitude'], $row['check_out_longitude'])
                        ? $row['check_out_latitude'].','.$row['check_out_longitude']
                        : '',
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
