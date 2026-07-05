<?php

namespace App\Http\Controllers;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Requests\AttendanceManagement\AttendanceManagementRequest;
use App\Models\BiometricDevice;
use App\Models\CompanyProfile;
use App\Models\Employee;
use App\Services\Reports\AttendanceReportPdfExporter;
use App\Services\Reports\AttendanceReportService;
use App\Support\AttendanceEntryAuthorization;
use App\Support\CompanyAccessScope;
use App\Support\RequestFormEmployeeSelection;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceManagementController extends Controller
{
    public function __construct(
        private readonly CompanyAccessScope $companyScope,
        private readonly RequestFormEmployeeSelection $requestFormEmployees,
        private readonly AttendanceEntryAuthorization $attendanceAuth,
    ) {}

    public function index(
        AttendanceManagementRequest $request,
        AttendanceReportService $reportService,
    ): InertiaResponse|StreamedResponse|HttpResponse {
        $validated = $request->validated();
        ['from' => $from, 'to' => $to] = $request->dateRange();

        $employeeId = isset($validated['employee_id']) ? (int) $validated['employee_id'] : null;
        $deviceId = isset($validated['biometric_device_id']) ? (int) $validated['biometric_device_id'] : null;
        $companyProfileId = isset($validated['company_profile_id']) ? (int) $validated['company_profile_id'] : null;
        $source = $validated['source'] ?? 'all';
        $viewer = $request->user();
        $canChooseEmployee = $this->requestFormEmployees->canChooseEmployee($viewer);
        $canChooseCompany = $this->companyScope->isGlobalAdmin($viewer);

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

        if ($companyProfileId !== null) {
            $this->companyScope->assertCanAccessCompanyProfile($viewer, $companyProfileId);
        } elseif (! $canChooseCompany) {
            $companyProfileId = $this->companyScope->companyProfileIdFor($viewer);
        }

        $report = $reportService->build(
            $from,
            $to,
            $employeeId,
            $deviceId,
            $viewer,
            $companyProfileId,
            $source === 'all' ? null : $source,
        );

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

        $employeeColumns = ['id', 'first_name', 'last_name', 'employee_code', 'biometric_user_id', 'company_profile_id'];
        $employeeQuery = $this->companyScope->scopedEmployeeQuery($viewer);

        if ($companyProfileId !== null) {
            $employeeQuery->where('company_profile_id', $companyProfileId);
        }

        $employees = $canChooseEmployee
            ? $employeeQuery->orderBy('first_name')->orderBy('last_name')->get($employeeColumns)
            : $this->requestFormEmployees->employeesForForm($viewer, $employeeColumns);

        $companies = $canChooseCompany
            ? CompanyProfile::query()->orderBy('company_name')->get(['id', 'company_name'])
            : collect(
                $this->companyScope->companyProfileIdFor($viewer) !== null
                    ? CompanyProfile::query()
                        ->whereKey($this->companyScope->companyProfileIdFor($viewer))
                        ->get(['id', 'company_name'])
                    : [],
            );

        $canManageEntries = $this->attendanceAuth->canManageForOthers($viewer)
            && $viewer->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::Update);
        $canDeleteEntries = $this->attendanceAuth->canDelete($viewer);
        $canModifyOvertime = $this->attendanceAuth->canModifyOvertime($viewer);

        return Inertia::render('attendance-management/index', [
            'rows' => $paginated,
            'filters' => [
                'from' => $from,
                'to' => $to,
                'employee_id' => $employeeId !== null ? (string) $employeeId : $request->input('employee_id'),
                'company_profile_id' => $companyProfileId !== null ? (string) $companyProfileId : $request->input('company_profile_id'),
                'biometric_device_id' => $request->input('biometric_device_id'),
                'source' => $source,
            ],
            'summary' => array_merge($report['summary'], [
                'total_manual_entries' => $report['total_manual_entries'],
                'total_biometric_punches' => $report['total_punches'],
            ]),
            'employees' => $employees->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'name' => trim($employee->first_name.' '.$employee->last_name),
                'employee_code' => $employee->employee_code,
                'biometric_user_id' => $employee->biometric_user_id,
            ]),
            'companies' => $companies->map(fn (CompanyProfile $company) => [
                'id' => $company->id,
                'name' => $company->company_name,
            ]),
            'devices' => BiometricDevice::query()->orderBy('name')->get(['id', 'name']),
            'canChooseEmployee' => $canChooseEmployee,
            'canChooseCompany' => $canChooseCompany,
            'canManageEntries' => $canManageEntries,
            'canDeleteEntries' => $canDeleteEntries,
            'canModifyOvertime' => $canModifyOvertime,
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    private function csvResponse(array $rows, string $from, string $to): StreamedResponse
    {
        $filename = 'attendance-management-'.$from.'-to-'.$to.'.csv';

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'Date',
                'Company',
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
                'Daily summary',
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
                    $row['company_name'] ?? '',
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
                    $row['daily_summary'] ?? '',
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
