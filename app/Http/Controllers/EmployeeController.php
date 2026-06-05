<?php

namespace App\Http\Controllers;

use App\Contracts\FaceVerificationContract;
use App\Enums\FaceProfileAngle;
use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Requests\Employee\ImportEmployeesRequest;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeePrivateInformationRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Http\Requests\Employee\UpdateProfileRequest;
use App\Http\Requests\Employee\UploadProfileDocumentRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\DocumentType;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Models\ItAssetRequest;
use App\Models\JobPosition;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Models\WorkTimetable;
use App\Services\Reports\AttendanceReportPdfExporter;
use App\Services\Reports\AttendanceReportService;
use App\Support\CompanyAccessScope;
use App\Support\ItAssetValuation;
use Illuminate\Contracts\View\View as ViewContract;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeController extends Controller
{
    public function __construct(
        private readonly FaceVerificationContract $faceVerification,
        private readonly ItAssetValuation $valuation,
        private readonly CompanyAccessScope $companyScope,
    ) {}

    public function profile(Request $request): Response
    {
        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $employee = Employee::query()
            ->with(['department', 'jobPosition', 'companyProfile', 'workTimetable', 'documents.documentType'])
            ->where('user_id', $user->id)
            ->first();

        if ($employee === null && ! $user->isAdministrator()) {
            abort(403);
        }

        if ($employee instanceof Employee) {
            $employee->photo_url = $employee->photo
                ? '/storage/'.ltrim($employee->photo, '/')
                : null;
        }

        $approvedLeaveUsage = collect();
        $approvedDaysUsed = 0.0;
        $openingBalance = 0.0;

        if ($employee instanceof Employee) {
            $approvedLeaveUsage = LeaveRequest::query()
                ->where('employee_id', $employee->id)
                ->where('status', 'approved')
                ->orderByDesc('decided_at')
                ->orderByDesc('id')
                ->get(['id', 'absence_types', 'absence_other', 'period_from', 'period_to', 'days', 'status', 'decided_at']);

            $paidLeaveTypeNames = LeaveType::query()
                ->where('leave_category', 'paid')
                ->pluck('name')
                ->filter(static fn ($name): bool => is_string($name) && $name !== '')
                ->values()
                ->all();

            $approvedDaysUsed = (float) $approvedLeaveUsage->sum(function (LeaveRequest $leaveRequest) use ($paidLeaveTypeNames): float {
                $types = is_array($leaveRequest->absence_types) ? $leaveRequest->absence_types : [];
                $leaveType = (string) ($types[0] ?? '');
                if ($leaveType === '' || ! in_array($leaveType, $paidLeaveTypeNames, true)) {
                    return 0.0;
                }

                return (float) ($leaveRequest->days ?? 0);
            });

            $openingBalance = (float) ($employee->leave_opening_balance ?? 0);
        }

        $leaveCategoryByName = LeaveType::query()
            ->pluck('leave_category', 'name')
            ->mapWithKeys(static fn ($category, $name): array => [(string) $name => (string) $category])
            ->all();

        $companyForSignature = null;
        if ($employee instanceof Employee && $employee->companyProfile !== null) {
            $companyForSignature = $employee->companyProfile;
        }
        if ($companyForSignature === null) {
            $companyForSignature = CompanyProfile::query()->first();
        }

        $emailSignatureCompanyProfile = $companyForSignature instanceof CompanyProfile
            ? [
                'company_name' => $companyForSignature->company_name,
                'company_address_1' => $companyForSignature->company_address_1,
                'company_address_2' => $companyForSignature->company_address_2,
                'website' => $companyForSignature->website,
                'signature_template' => $companyForSignature->signature_template,
            ]
            : null;

        $emailSignaturePreview = [
            'fullName' => $employee instanceof Employee
                ? trim($employee->first_name.' '.$employee->last_name)
                : (string) ($user->name ?? ''),
            'designation' => $employee instanceof Employee ? ($employee->jobPosition?->name) : null,
            'email' => $employee instanceof Employee
                ? $employee->email_address
                : (string) ($user->email ?? ''),
            'phone' => $employee instanceof Employee
                ? ($employee->mobile ?? $employee->contact_number)
                : null,
        ];

        return Inertia::render('employees/profile', [
            'employee' => $employee,
            'hasEmployeeProfile' => $employee instanceof Employee,
            'emailSignatureCompanyProfile' => $emailSignatureCompanyProfile,
            'emailSignaturePreview' => $emailSignaturePreview,
            'leaveConfig' => [
                'openingBalance' => $openingBalance,
                'approvedDaysUsed' => $approvedDaysUsed,
                'liveRemainingBalance' => $openingBalance - $approvedDaysUsed,
                'usage' => $approvedLeaveUsage->map(function (LeaveRequest $leaveRequest) use ($leaveCategoryByName): array {
                    $types = is_array($leaveRequest->absence_types) ? $leaveRequest->absence_types : [];
                    $leaveType = (string) ($types[0] ?? '');
                    $category = $leaveCategoryByName[$leaveType] ?? 'paid';

                    return [
                        'id' => (int) $leaveRequest->id,
                        'leave_type' => $leaveType !== ''
                            ? $leaveType
                            : (string) ($leaveRequest->absence_other ?: '—'),
                        'leave_category' => $category,
                        'period_from' => $leaveRequest->period_from,
                        'period_to' => $leaveRequest->period_to,
                        'days' => $leaveRequest->days,
                        'status' => $leaveRequest->status,
                        'decided_at' => $leaveRequest->decided_at?->toDateString(),
                    ];
                })->values()->all(),
            ],
            'faceLogin' => [
                'enabled' => $user->face_enrolled_at !== null || (is_array($user->face_profile) && $user->face_profile !== []),
                'enrolled_at' => $user->face_enrolled_at?->toIso8601String(),
                'provider' => $user->face_provider,
                'angles' => array_values(array_filter(
                    array_keys(is_array($user->face_profile) ? $user->face_profile : []),
                    static fn (mixed $value): bool => in_array($value, array_map(
                        static fn (FaceProfileAngle $angle): string => $angle->value,
                        FaceProfileAngle::ordered(),
                    ), true),
                )),
            ],
        ]);
    }

    public function updateProfileFaceLogin(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $employee = Employee::query()->where('user_id', $user->id)->first();
        if ($employee === null) {
            abort(403);
        }

        $imagesByAngle = [];
        foreach (FaceProfileAngle::ordered() as $angle) {
            $field = 'face_capture_'.$angle->value;
            $file = $request->file($field);
            if ($file === null || ! $file->isValid()) {
                throw ValidationException::withMessages([
                    $field => __('Please capture :angle angle before saving.', ['angle' => $angle->value]),
                ]);
            }
            $imagesByAngle[$angle->value] = $file;
        }

        $this->faceVerification->enrollProfile($user, $imagesByAngle);

        return back()->with('success', 'Face login enabled for your profile.');
    }

    public function destroyProfileFaceLogin(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        if (! $user->isAdministrator()) {
            abort(403);
        }

        $employee = Employee::query()->where('user_id', $user->id)->first();
        if ($employee === null) {
            abort(403);
        }

        $this->faceVerification->deleteReference($user);

        return back()->with('success', 'Face login disabled for your profile.');
    }

    public function updateProfile(UpdateProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $employee = Employee::query()->where('user_id', $user->id)->first();
        if ($employee === null) {
            abort(403);
        }

        $data = $request->validated();
        $employee->update($data);

        return back()->with('success', 'Profile information updated.');
    }

    public function uploadProfileDocument(UploadProfileDocumentRequest $request): RedirectResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $employee = Employee::query()->with('documents.documentType')->where('user_id', $user->id)->first();
        if ($employee === null) {
            abort(403);
        }

        $file = $request->file('document');
        if ($file === null) {
            return back()->with('error', 'Please select a document.');
        }

        $documentType = DocumentType::query()->find($request->integer('document_type_id'));
        if ($documentType === null) {
            return back()->with('error', 'Please select a valid document type.');
        }

        $path = $file->store("employees/{$employee->id}/documents", 'public');
        $this->createEmployeeDocumentVersion(
            $employee,
            $documentType,
            $path,
            $file->getClientOriginalName(),
            $request->input('expiry_date')
        );

        return back()->with('success', 'Document uploaded successfully.');
    }

    public function destroyProfileDocument(Request $request, EmployeeDocument $employee_document): RedirectResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $employee = Employee::query()->where('user_id', $user->id)->first();
        if ($employee === null || $employee_document->employee_id !== $employee->id) {
            abort(404);
        }

        Storage::disk('public')->delete($employee_document->path);
        $employee_document->delete();

        return back()->with('success', 'Document deleted.');
    }

    public function showProfileDocument(Request $request, EmployeeDocument $employee_document): BinaryFileResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $employee = Employee::query()->where('user_id', $user->id)->first();
        if ($employee === null || $employee_document->employee_id !== $employee->id) {
            abort(404);
        }

        $relativePath = $this->resolveExistingPublicDiskDocumentPath($employee_document);
        if ($relativePath === null) {
            abort(404, 'Document file not found.');
        }

        return response()->file(
            Storage::disk('public')->path($relativePath),
            [
                'Content-Disposition' => 'inline; filename="'.$employee_document->original_name.'"',
            ]
        );
    }

    /**
     * Display a listing of the employees.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $hasUserActiveColumn = Schema::hasColumn('users', 'is_active');

        $employees = $this->scopedEmployeesQuery($user)
            ->with([
                'department.managerEmployee:id,first_name,last_name',
                'jobPosition',
                'user' => function ($query) use ($hasUserActiveColumn): void {
                    $query->select($hasUserActiveColumn ? ['id', 'is_active'] : ['id']);
                },
            ]);

        $this->applyEmployeeFilters($employees, $request);

        $employees = $employees
            ->orderBy('employee_code')
            ->paginate(15)
            ->through(function (Employee $employee) {
                $employee->photo_url = $employee->photo
                    ? '/storage/'.ltrim($employee->photo, '/')
                    : null;
                $employee->user_active = $employee->user?->is_active ?? null;

                return $employee;
            })
            ->withQueryString();

        $totalEmployees = $this->scopedEmployeesQuery($user)->count();
        $activeEmployeesQuery = $this->scopedEmployeesQuery($user)->whereNotNull('user_id');
        if ($hasUserActiveColumn) {
            $activeEmployeesQuery->whereHas('user', function (Builder $query): void {
                $query->where('is_active', true);
            });
        }
        $activeEmployees = $activeEmployeesQuery->count();

        $departmentsQuery = $this->scopedDepartmentsQuery($user);

        return Inertia::render('employees/index', [
            'employees' => $employees,
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'activeEmployees' => $activeEmployees,
                'totalDepartments' => (clone $departmentsQuery)->count(),
                'noLoginAccessEmployees' => max($totalEmployees - $activeEmployees, 0),
            ],
            'filters' => $request->only('search', 'department_id', 'employee_status'),
            'departments' => $departmentsQuery->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for creating a new employee.
     */
    public function create(): Response
    {
        $user = request()->user();
        $canViewActivityLogs = $user?->hasModuleAbility(PermissionModule::ActivityLogs, ModuleAbility::View) ?? false;

        return Inertia::render('employees/create', [
            'departments' => $this->scopedDepartmentsQuery($user)->orderBy('code')->get(['id', 'code', 'name']),
            'jobPositions' => JobPosition::query()->orderBy('code')->get(['id', 'code', 'name']),
            'companyProfiles' => $this->scopedCompanyProfilesQuery($user)->orderBy('company_name')->get([
                'id',
                'company_name',
                'company_address_1',
                'company_address_2',
                'website',
                'signature_template',
            ]),
            'workTimetables' => WorkTimetable::query()->orderBy('name')->get(['id', 'name']),
            'documentTypes' => DocumentType::query()
                ->where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name', 'requires_expiry_date']),
            'canViewActivityLogs' => $canViewActivityLogs,
        ]);
    }

    public function downloadTemplate(): StreamedResponse
    {
        $headers = [
            'employee_code',
            'first_name',
            'last_name',
            'email_address',
            'contact_number',
            'address_1',
            'address_2',
            'department_code',
            'job_position_code',
            'work_timetable_name',
            'company_profile_name',
        ];

        $sampleRow = [
            'EMP-0001',
            'John',
            'Doe',
            'john.doe@example.com',
            '+971500000000',
            'Building 10, Street 5',
            '',
            'ENG',
            'DEV',
            'General Shift',
            '',
        ];

        $callback = static function () use ($headers, $sampleRow): void {
            $stream = fopen('php://output', 'w');
            if ($stream === false) {
                return;
            }

            fputcsv($stream, $headers);
            fputcsv($stream, $sampleRow);
            fclose($stream);
        };

        return response()->streamDownload($callback, 'employee-import-template.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $groupBy = in_array($request->input('group_by'), ['department', 'manager'], true)
            ? (string) $request->input('group_by')
            : null;

        $exportQuery = $this->scopedEmployeesQuery($request->user())
            ->with(['department:id,code,name,manager_employee_id', 'department.managerEmployee:id,first_name,last_name', 'jobPosition:id,code,name', 'workTimetable:id,name', 'companyProfile:id,company_name']);
        $this->applyEmployeeFilters($exportQuery, $request);

        if ($groupBy === 'department') {
            $exportQuery->orderBy('department_id');
        }

        if ($groupBy === 'manager') {
            $exportQuery->orderBy('department_id');
        }

        $callback = function () use ($exportQuery, $groupBy): void {
            $stream = fopen('php://output', 'w');
            if ($stream === false) {
                return;
            }

            $headers = [
                'employee_code',
                'first_name',
                'last_name',
                'email_address',
                'contact_number',
                'address_1',
                'address_2',
                'department_code',
                'department_name',
                'job_position_code',
                'job_position_name',
                'work_timetable_name',
                'company_profile_name',
                'role',
            ];

            if ($groupBy !== null) {
                array_unshift($headers, 'group');
            }

            fputcsv($stream, $headers);

            $exportQuery
                ->orderBy('employee_code')
                ->chunk(500, function ($employees) use ($stream, $groupBy): void {
                    foreach ($employees as $employee) {
                        $row = [
                            $employee->employee_code,
                            $employee->first_name,
                            $employee->last_name,
                            $employee->email_address,
                            $employee->contact_number,
                            $employee->address_1,
                            $employee->address_2,
                            $employee->department?->code,
                            $employee->department?->name,
                            $employee->jobPosition?->code,
                            $employee->jobPosition?->name,
                            $employee->workTimetable?->name,
                            $employee->companyProfile?->company_name,
                            $employee->role,
                        ];

                        if ($groupBy !== null) {
                            array_unshift($row, $this->resolveEmployeeExportGroup($employee, $groupBy));
                        }

                        fputcsv($stream, $row);
                    }
                });

            fclose($stream);
        };

        return response()->streamDownload($callback, 'employees-export.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function resolveEmployeeExportGroup(Employee $employee, string $groupBy): string
    {
        if ($groupBy === 'department') {
            return $employee->department?->name ?? 'Undefined';
        }

        if ($groupBy === 'manager') {
            if ($employee->department?->managerEmployee) {
                return trim($employee->department->managerEmployee->first_name.' '.$employee->department->managerEmployee->last_name);
            }

            return 'No Manager Assigned';
        }

        return '';
    }

    private function applyEmployeeFilters(Builder $query, Request $request): void
    {
        $query
            ->when(
                $request->filled('department_id'),
                fn (Builder $innerQuery) => $innerQuery->where('department_id', (int) $request->input('department_id'))
            )
            ->when(
                $request->filled('search'),
                function (Builder $innerQuery) use ($request): void {
                    $search = trim((string) $request->input('search'));
                    $nameTerms = preg_split('/\s+/', $search) ?: [];

                    $innerQuery->where(function (Builder $searchQuery) use ($search, $nameTerms): void {
                        $searchQuery->where('employee_code', 'like', '%'.$search.'%')
                            ->orWhere('first_name', 'like', '%'.$search.'%')
                            ->orWhere('last_name', 'like', '%'.$search.'%')
                            ->orWhere('email_address', 'like', '%'.$search.'%')
                            ->orWhere('contact_number', 'like', '%'.$search.'%');

                        if (count($nameTerms) > 1) {
                            $searchQuery->orWhere(function (Builder $nameQuery) use ($nameTerms): void {
                                foreach ($nameTerms as $term) {
                                    $nameQuery->where(function (Builder $termQuery) use ($term): void {
                                        $termQuery->where('first_name', 'like', '%'.$term.'%')
                                            ->orWhere('last_name', 'like', '%'.$term.'%');
                                    });
                                }
                            });
                        }
                    });
                }
            )
            ->when(
                $request->filled('employee_status'),
                function (Builder $innerQuery) use ($request): void {
                    $status = (string) $request->input('employee_status');
                    if ($status === 'Employed') {
                        $innerQuery->whereIn('employee_status', ['Employed', 'Active']);

                        return;
                    }

                    $innerQuery->where('employee_status', $status);
                }
            );
    }

    public function import(ImportEmployeesRequest $request): RedirectResponse
    {
        $user = $request->user();
        $viewerCompanyProfileId = $this->companyScope->companyProfileIdFor($user);
        $forceCompanyOnImport = $this->companyScope->shouldScope($user);

        $file = $request->file('file');
        if ($file === null) {
            return back()->with('error', 'Please upload a CSV file.');
        }

        $handle = fopen($file->getRealPath(), 'rb');
        if ($handle === false) {
            return back()->with('error', 'Unable to read the uploaded file.');
        }

        $headerRow = fgetcsv($handle);
        if (! is_array($headerRow)) {
            fclose($handle);

            return back()->with('error', 'The uploaded file is empty.');
        }

        $headers = array_map(fn ($value) => $this->normalizeHeader((string) $value), $headerRow);
        $requiredHeaders = [
            'employee_code',
            'first_name',
            'last_name',
            'email_address',
            'department_code',
            'job_position_code',
            'work_timetable_name',
        ];
        $missingHeaders = array_values(array_diff($requiredHeaders, $headers));
        if ($missingHeaders !== []) {
            fclose($handle);

            return back()->with('error', 'Template headers are missing: '.implode(', ', $missingHeaders));
        }

        $departmentMap = Department::query()
            ->get(['id', 'code'])
            ->mapWithKeys(fn (Department $department) => [strtoupper(trim($department->code)) => $department->id])
            ->all();
        $jobPositionMap = JobPosition::query()
            ->get(['id', 'code'])
            ->mapWithKeys(fn (JobPosition $jobPosition) => [strtoupper(trim($jobPosition->code)) => $jobPosition->id])
            ->all();
        $workTimetableMap = WorkTimetable::query()
            ->withCount('days')
            ->get(['id', 'name'])
            ->keyBy(fn (WorkTimetable $workTimetable) => mb_strtolower(trim($workTimetable->name)))
            ->all();
        $companyProfileMap = CompanyProfile::query()
            ->get(['id', 'company_name'])
            ->keyBy(fn (CompanyProfile $companyProfile) => mb_strtolower(trim($companyProfile->company_name)))
            ->all();

        $existingCodes = Employee::query()
            ->pluck('employee_code')
            ->map(fn (string $value) => strtoupper(trim($value)))
            ->all();
        $existingEmails = Employee::query()
            ->pluck('email_address')
            ->map(fn (string $value) => mb_strtolower(trim($value)))
            ->all();

        $seenCodes = array_fill_keys($existingCodes, true);
        $seenEmails = array_fill_keys($existingEmails, true);
        $rowsToCreate = [];
        $errors = [];
        $lineNumber = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;
            $row = is_array($row) ? $row : [];
            if ($this->rowIsEmpty($row)) {
                continue;
            }

            $entry = [];
            foreach ($headers as $index => $header) {
                $entry[$header] = isset($row[$index]) ? trim((string) $row[$index]) : '';
            }

            $validation = Validator::make($entry, [
                'employee_code' => ['required', 'string', 'max:50'],
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'email_address' => ['required', 'email', 'max:255'],
                'contact_number' => ['nullable', 'string', 'max:50'],
                'address_1' => ['nullable', 'string', 'max:255'],
                'address_2' => ['nullable', 'string', 'max:255'],
                'department_code' => ['required', 'string', 'max:50'],
                'job_position_code' => ['required', 'string', 'max:50'],
                'work_timetable_name' => ['required', 'string', 'max:255'],
                'company_profile_name' => ['nullable', 'string', 'max:255'],
            ]);

            if ($validation->fails()) {
                $errors[] = "Row {$lineNumber}: ".implode(', ', $validation->errors()->all());

                continue;
            }

            $employeeCodeKey = strtoupper($entry['employee_code']);
            $emailKey = mb_strtolower($entry['email_address']);
            $departmentCodeKey = strtoupper($entry['department_code']);
            $jobPositionCodeKey = strtoupper($entry['job_position_code']);
            $workTimetableNameKey = mb_strtolower($entry['work_timetable_name']);
            $companyNameKey = mb_strtolower($entry['company_profile_name'] ?? '');

            if (isset($seenCodes[$employeeCodeKey])) {
                $errors[] = "Row {$lineNumber}: employee_code '{$entry['employee_code']}' is duplicate.";

                continue;
            }
            if (isset($seenEmails[$emailKey])) {
                $errors[] = "Row {$lineNumber}: email_address '{$entry['email_address']}' is duplicate.";

                continue;
            }
            if (! isset($departmentMap[$departmentCodeKey])) {
                $errors[] = "Row {$lineNumber}: department_code '{$entry['department_code']}' not found.";

                continue;
            }
            if (! isset($jobPositionMap[$jobPositionCodeKey])) {
                $errors[] = "Row {$lineNumber}: job_position_code '{$entry['job_position_code']}' not found.";

                continue;
            }
            if (! isset($workTimetableMap[$workTimetableNameKey])) {
                $errors[] = "Row {$lineNumber}: work_timetable_name '{$entry['work_timetable_name']}' not found.";

                continue;
            }

            /** @var WorkTimetable $workTimetable */
            $workTimetable = $workTimetableMap[$workTimetableNameKey];
            if ((int) $workTimetable->days_count !== 7) {
                $errors[] = "Row {$lineNumber}: work_timetable_name '{$entry['work_timetable_name']}' must include all 7 weekdays.";

                continue;
            }

            $companyProfileId = null;
            if ($forceCompanyOnImport) {
                if ($companyNameKey !== '' && isset($companyProfileMap[$companyNameKey])) {
                    /** @var CompanyProfile $namedCompanyProfile */
                    $namedCompanyProfile = $companyProfileMap[$companyNameKey];
                    if ((int) $namedCompanyProfile->id !== $viewerCompanyProfileId) {
                        $errors[] = "Row {$lineNumber}: company_profile_name must match your assigned company.";

                        continue;
                    }
                }
                $companyProfileId = $viewerCompanyProfileId;
            } elseif ($companyNameKey !== '') {
                if (! isset($companyProfileMap[$companyNameKey])) {
                    $errors[] = "Row {$lineNumber}: company_profile_name '{$entry['company_profile_name']}' not found.";

                    continue;
                }
                /** @var CompanyProfile $companyProfile */
                $companyProfile = $companyProfileMap[$companyNameKey];
                $companyProfileId = $companyProfile->id;
            }

            $rowsToCreate[] = [
                'employee_code' => $entry['employee_code'],
                'first_name' => $entry['first_name'],
                'last_name' => $entry['last_name'],
                'email_address' => $entry['email_address'],
                'contact_number' => $entry['contact_number'] ?: null,
                'address_1' => $entry['address_1'] ?: null,
                'address_2' => $entry['address_2'] ?: null,
                'department_id' => $departmentMap[$departmentCodeKey],
                'job_position_id' => $jobPositionMap[$jobPositionCodeKey],
                'work_timetable_id' => $workTimetable->id,
                'company_profile_id' => $companyProfileId,
                'role' => 'Employee',
            ];

            $seenCodes[$employeeCodeKey] = true;
            $seenEmails[$emailKey] = true;
        }

        fclose($handle);

        if ($rowsToCreate !== []) {
            DB::transaction(function () use ($rowsToCreate): void {
                foreach ($rowsToCreate as $row) {
                    Employee::query()->create($row);
                }
            });
        }

        if ($rowsToCreate === [] && $errors !== []) {
            return back()->with('error', 'Import failed. '.implode(' | ', array_slice($errors, 0, 5)));
        }

        if ($errors !== []) {
            return to_route('employees.index')->with(
                'success',
                sprintf(
                    'Imported %d employee(s). Skipped %d invalid row(s): %s',
                    count($rowsToCreate),
                    count($errors),
                    implode(' | ', array_slice($errors, 0, 3))
                )
            );
        }

        return to_route('employees.index')->with('success', sprintf('Imported %d employee(s) successfully.', count($rowsToCreate)));
    }

    /**
     * Store a newly created employee.
     */
    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $photo = $data['photo'] ?? null;
        $documents = $data['documents'] ?? [];
        $documentTypeIds = $request->input('document_type_ids', []);
        $documentExpiryDates = $request->input('document_expiry_dates', []);
        unset($data['photo'], $data['documents'], $data['document_type_ids'], $data['document_expiry_dates']);

        $data['role'] = 'Employee';

        if ($this->companyScope->shouldScope($request->user())) {
            $data['company_profile_id'] = $this->companyScope->companyProfileIdFor($request->user());
        }

        $employee = Employee::query()->create($data);

        if ($photo) {
            $path = $photo->store("employees/{$employee->id}", 'public');
            $employee->update(['photo' => $path]);
        }

        foreach ($documents as $i => $file) {
            $path = $file->store("employees/{$employee->id}/documents", 'public');
            $documentType = DocumentType::query()->find($documentTypeIds[$i] ?? null);
            if ($documentType === null) {
                continue;
            }
            $this->createEmployeeDocumentVersion(
                $employee,
                $documentType,
                $path,
                $file->getClientOriginalName(),
                $documentExpiryDates[$i] ?? null
            );
        }

        return to_route('employees.edit', $employee)->with('success', 'Employee updated successfully.');
    }

    /**
     * Display the employee business card (printable).
     */
    public function businessCard(Request $request, Employee $employee): Response
    {
        $this->companyScope->assertCanAccessEmployee($request->user(), $employee);

        $employee->load(['department', 'jobPosition', 'companyProfile']);
        $this->attachBusinessCardCompanyProfile($employee);
        $employee->photo_url = $employee->photo
            ? '/storage/'.ltrim($employee->photo, '/')
            : null;
        $employee->company_logo_url = $employee->getAttribute('company_logo')
            ? '/storage/'.ltrim((string) $employee->getAttribute('company_logo'), '/')
            : null;

        return Inertia::render('employees/business-card', [
            'employee' => $employee,
            'appName' => config('app.name'),
            'embedded' => $request->boolean('embed'),
        ]);
    }

    public function businessCardEmbed(Employee $employee): ViewContract
    {
        $this->companyScope->assertCanAccessEmployee(request()->user(), $employee);

        $employee->load(['department', 'jobPosition', 'companyProfile']);
        $this->attachBusinessCardCompanyProfile($employee);
        $employee->photo_url = $employee->photo
            ? '/storage/'.ltrim($employee->photo, '/')
            : null;
        $employee->company_logo_url = $employee->getAttribute('company_logo')
            ? '/storage/'.ltrim((string) $employee->getAttribute('company_logo'), '/')
            : null;
        $appName = (string) config('app.name');
        $vCard = $this->buildEmployeeVCard($employee, $appName);
        $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=320x320&data='.rawurlencode($vCard);

        return view('employees.business-card-embed', [
            'employee' => $employee,
            'appName' => $appName,
            'qrCodeUrl' => $qrCodeUrl,
        ]);
    }

    private function attachBusinessCardCompanyProfile(Employee $employee): void
    {
        if ($employee->companyProfile !== null) {
            $this->attachCompanyProfileBusinessCardLogoUrls($employee->companyProfile);

            return;
        }

        $companyProfile = CompanyProfile::query()
            ->orderBy('id')
            ->first();

        if ($companyProfile === null) {
            return;
        }

        $this->attachCompanyProfileBusinessCardLogoUrls($companyProfile);
        $employee->setRelation('companyProfile', $companyProfile);
    }

    private function attachCompanyProfileBusinessCardLogoUrls(CompanyProfile $companyProfile): void
    {
        $companyProfile->logo_url = $companyProfile->logo
            ? '/storage/'.ltrim($companyProfile->logo, '/')
            : null;
        $companyProfile->business_card_logo_url = $companyProfile->business_card_logo
            ? '/storage/'.ltrim($companyProfile->business_card_logo, '/')
            : null;

        $businessCardBackLogoColumns = [
            'business_card_back_logo_1',
            'business_card_back_logo_2',
            'business_card_back_logo_3',
            'business_card_back_logo_4',
        ];

        $companyProfile->business_card_back_logo_urls = array_map(
            static fn (string $column): ?string => $companyProfile->{$column}
                ? '/storage/'.ltrim($companyProfile->{$column}, '/')
                : null,
            $businessCardBackLogoColumns,
        );
    }

    /**
     * Download attendance PDF for an employee mapped on a biometric device.
     */
    public function downloadAttendancePdf(
        Request $request,
        Employee $employee,
        AttendanceReportService $attendanceReportService,
        AttendanceReportPdfExporter $pdfExporter,
    ): HttpResponse {
        $this->companyScope->assertCanAccessEmployee($request->user(), $employee);

        if (trim((string) $employee->biometric_user_id) === '') {
            abort(404);
        }

        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $to = isset($validated['to'])
            ? Carbon::parse($validated['to'])->toDateString()
            : now()->toDateString();
        $from = isset($validated['from'])
            ? Carbon::parse($validated['from'])->toDateString()
            : Carbon::parse($to)->subDays(30)->toDateString();

        if (Carbon::parse($from)->greaterThan(Carbon::parse($to))) {
            $from = Carbon::parse($to)->subDays(30)->toDateString();
        }

        $report = $attendanceReportService->buildForEmployee($employee, $from, $to);

        return $pdfExporter->download(
            rows: $report['rows'],
            from: $from,
            to: $to,
            employee: $employee,
        );
    }

    /**
     * Show the form for editing the specified employee.
     */
    public function show(Employee $employee): RedirectResponse
    {
        $this->companyScope->assertCanAccessEmployee(request()->user(), $employee);

        return to_route('employees.edit', [
            'employee' => $employee,
            'mode' => 'view',
        ]);
    }

    /**
     * Show the form for editing the specified employee.
     */
    public function edit(Request $request, Employee $employee, AttendanceReportService $attendanceReportService): Response
    {
        $this->companyScope->assertCanAccessEmployee($request->user(), $employee);

        $hasUserActiveColumn = Schema::hasColumn('users', 'is_active');

        $employee->load([
            'department',
            'jobPosition',
            'documents.documentType',
            'companyProfile',
            'workTimetable',
            'user' => function ($query) use ($hasUserActiveColumn): void {
                $query->select($hasUserActiveColumn ? ['id', 'is_active'] : ['id']);
            },
        ]);
        $employee->photo_url = $employee->photo
            ? '/storage/'.ltrim($employee->photo, '/')
            : null;

        $approvedLeaveUsage = LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->orderByDesc('decided_at')
            ->orderByDesc('id')
            ->get(['id', 'absence_types', 'absence_other', 'period_from', 'period_to', 'days', 'status', 'decided_at']);

        $paidLeaveTypeNames = LeaveType::query()
            ->where('leave_category', 'paid')
            ->pluck('name')
            ->filter(static fn ($name): bool => is_string($name) && $name !== '')
            ->values()
            ->all();
        $leaveCategoryByName = LeaveType::query()
            ->pluck('leave_category', 'name')
            ->mapWithKeys(static fn ($category, $name): array => [(string) $name => (string) $category])
            ->all();

        $approvedDaysUsed = (float) $approvedLeaveUsage->sum(function (LeaveRequest $leaveRequest) use ($paidLeaveTypeNames): float {
            $types = is_array($leaveRequest->absence_types) ? $leaveRequest->absence_types : [];
            $leaveType = (string) ($types[0] ?? '');
            if ($leaveType === '' || ! in_array($leaveType, $paidLeaveTypeNames, true)) {
                return 0.0;
            }

            return (float) ($leaveRequest->days ?? 0);
        });
        $openingBalance = (float) ($employee->leave_opening_balance ?? 0);
        $canViewActivityLogs = $request->user()?->hasModuleAbility(PermissionModule::ActivityLogs, ModuleAbility::View) ?? false;
        $activityLogs = $canViewActivityLogs
            ? $employee->activityLogs()
                ->with('actor:id,name')
                ->limit(200)
                ->get()
                ->map(function ($log): array {
                    $oldValue = is_string($log->old_value) ? trim($log->old_value) : null;
                    $newValue = is_string($log->new_value) ? trim($log->new_value) : null;

                    return [
                        'id' => (int) $log->id,
                        'action' => (string) $log->action,
                        'field' => (string) $log->field_name,
                        'old_value' => $oldValue === '' ? null : $oldValue,
                        'new_value' => $newValue === '' ? null : $newValue,
                        'performed_by' => (string) ($log->actor?->name ?? $log->actor_name ?? 'System'),
                        'performed_at' => $log->created_at?->toIso8601String(),
                    ];
                })
                ->values()
                ->all()
            : [];
        $orderedEmployeeIds = $this->scopedEmployeesQuery($request->user())
            ->orderBy('employee_code')
            ->orderBy('id')
            ->pluck('id')
            ->values();
        $employeePosition = $orderedEmployeeIds->search((int) $employee->id);
        $previousEmployeeId = null;
        $nextEmployeeId = null;

        if ($employeePosition !== false) {
            $previousEmployeeId = $employeePosition > 0
                ? $orderedEmployeeIds->get($employeePosition - 1)
                : null;
            $nextEmployeeId = $employeePosition < ($orderedEmployeeIds->count() - 1)
                ? $orderedEmployeeIds->get($employeePosition + 1)
                : null;
        }

        $attendance = null;

        if (trim((string) $employee->biometric_user_id) !== '') {
            $to = $request->date('to')?->toDateString() ?? now()->toDateString();
            $from = $request->date('from')?->toDateString() ?? Carbon::parse($to)->subDays(30)->toDateString();

            if (Carbon::parse($from)->greaterThan(Carbon::parse($to))) {
                $from = Carbon::parse($to)->subDays(30)->toDateString();
            }

            $report = $attendanceReportService->buildForEmployee($employee, $from, $to);
            $attendance = [
                'filters' => [
                    'from' => $from,
                    'to' => $to,
                ],
                'summary' => [
                    'total_days' => count($report['rows']),
                    'total_punches' => $report['total_punches'],
                ],
                'rows' => $report['rows'],
            ];
        }

        return Inertia::render('employees/edit', [
            'employee' => $employee,
            'attendance' => $attendance,
            'departments' => $this->scopedDepartmentsQuery($request->user())->orderBy('code')->get(['id', 'code', 'name']),
            'jobPositions' => JobPosition::query()->orderBy('code')->get(['id', 'code', 'name']),
            'companyProfiles' => $this->scopedCompanyProfilesQuery($request->user())->orderBy('company_name')->get([
                'id',
                'company_name',
                'company_address_1',
                'company_address_2',
                'website',
                'signature_template',
            ]),
            'workTimetables' => WorkTimetable::query()->orderBy('name')->get(['id', 'name']),
            'documentTypes' => DocumentType::query()
                ->where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name', 'requires_expiry_date']),
            'viewMode' => $request->query('mode') === 'view',
            'employeeLoginActive' => $employee->user?->is_active ?? null,
            'canViewActivityLogs' => $canViewActivityLogs,
            'activityLogs' => $activityLogs,
            'asset' => $this->approvedAssetPayload($employee),
            'leaveConfig' => [
                'openingBalance' => $openingBalance,
                'approvedDaysUsed' => $approvedDaysUsed,
                'liveRemainingBalance' => $openingBalance - $approvedDaysUsed,
                'usage' => $approvedLeaveUsage->map(function (LeaveRequest $leaveRequest) use ($leaveCategoryByName): array {
                    $types = is_array($leaveRequest->absence_types) ? $leaveRequest->absence_types : [];
                    $leaveType = (string) ($types[0] ?? '');
                    $category = $leaveCategoryByName[$leaveType] ?? 'paid';

                    return [
                        'id' => (int) $leaveRequest->id,
                        'leave_type' => $leaveType !== ''
                            ? $leaveType
                            : (string) ($leaveRequest->absence_other ?: '—'),
                        'leave_category' => $category,
                        'period_from' => $leaveRequest->period_from,
                        'period_to' => $leaveRequest->period_to,
                        'days' => $leaveRequest->days,
                        'status' => $leaveRequest->status,
                        'decided_at' => $leaveRequest->decided_at?->toDateString(),
                    ];
                })->values()->all(),
            ],
            'employeeNavigation' => [
                'previousId' => is_numeric($previousEmployeeId) ? (int) $previousEmployeeId : null,
                'nextId' => is_numeric($nextEmployeeId) ? (int) $nextEmployeeId : null,
            ],
        ]);
    }

    /**
     * Update the specified employee.
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $this->companyScope->assertCanAccessEmployee($request->user(), $employee);

        $data = $request->validated();
        if (! array_key_exists('leave_opening_balance', $data) || $data['leave_opening_balance'] === null) {
            $data['leave_opening_balance'] = (float) ($employee->leave_opening_balance ?? 0);
        }
        $userActive = $data['user_active'] ?? null;
        $photo = $data['photo'] ?? null;
        $documents = $data['documents'] ?? [];
        $documentTypeIds = $request->input('document_type_ids', []);
        $documentExpiryDates = $request->input('document_expiry_dates', []);
        unset($data['photo'], $data['documents'], $data['document_type_ids'], $data['document_expiry_dates'], $data['user_active']);

        if ($this->companyScope->shouldScope($request->user())) {
            $data['company_profile_id'] = $this->companyScope->companyProfileIdFor($request->user());
        }

        $employee->update($data);

        if ($photo) {
            if ($employee->photo) {
                Storage::disk('public')->delete($employee->photo);
            }
            $path = $photo->store("employees/{$employee->id}", 'public');
            $employee->update(['photo' => $path]);
        }

        foreach ($documents as $i => $file) {
            $path = $file->store("employees/{$employee->id}/documents", 'public');
            $documentType = DocumentType::query()->find($documentTypeIds[$i] ?? null);
            if ($documentType === null) {
                continue;
            }
            $this->createEmployeeDocumentVersion(
                $employee,
                $documentType,
                $path,
                $file->getClientOriginalName(),
                $documentExpiryDates[$i] ?? null
            );
        }

        if (Schema::hasColumn('users', 'is_active') && $employee->user_id !== null && $userActive !== null) {
            $employee->user()->update(['is_active' => (bool) $userActive]);
        }

        $tab = $request->input('tab');
        if (! in_array($tab, ['employee_information', 'work_information', 'documents', 'private_information', 'leave_configuration'], true)) {
            $tab = 'employee_information';
        }

        return to_route('employees.edit', [
            'employee' => $employee,
            'tab' => $tab,
            'mode' => 'view',
        ])->with('success', 'Employee updated successfully.');
    }

    public function updatePrivateInformation(UpdateEmployeePrivateInformationRequest $request, Employee $employee): RedirectResponse
    {
        $this->companyScope->assertCanAccessEmployee($request->user(), $employee);

        $employee->update($request->validated());

        $tab = $request->input('tab');
        if (! in_array($tab, ['employee_information', 'work_information', 'documents', 'private_information', 'leave_configuration'], true)) {
            $tab = 'private_information';
        }

        return to_route('employees.edit', [
            'employee' => $employee,
            'tab' => $tab,
            'mode' => 'view',
        ])->with('success', 'Private information updated.');
    }

    /**
     * Remove the specified employee.
     */
    public function destroy(Employee $employee): RedirectResponse
    {
        $this->companyScope->assertCanAccessEmployee(request()->user(), $employee);

        if ($employee->photo) {
            Storage::disk('public')->delete($employee->photo);
        }
        foreach ($employee->documents as $document) {
            Storage::disk('public')->delete($document->path);
        }
        $employee->delete();

        return to_route('employees.index');
    }

    /**
     * Remove the specified document from the employee.
     */
    public function destroyDocument(Employee $employee, EmployeeDocument $employee_document): RedirectResponse
    {
        $this->companyScope->assertCanAccessEmployee(request()->user(), $employee);

        if ($employee_document->employee_id !== $employee->id) {
            abort(404);
        }
        $path = str_replace('\\', '/', $employee_document->path);
        Storage::disk('public')->delete($employee_document->path);
        Storage::disk('public')->delete($path);
        Storage::disk('public')->deleteDirectory("employees/{$employee->id}/documents");
        $employee_document->delete();

        return back();
    }

    public function showDocument(Employee $employee, EmployeeDocument $employee_document): BinaryFileResponse
    {
        $this->companyScope->assertCanAccessEmployee(request()->user(), $employee);

        if ($employee_document->employee_id !== $employee->id) {
            abort(404);
        }

        $relativePath = $this->resolveExistingPublicDiskDocumentPath($employee_document);
        if ($relativePath === null) {
            abort(404, 'Document file not found.');
        }

        return response()->file(
            Storage::disk('public')->path($relativePath),
            [
                'Content-Disposition' => 'inline; filename="'.$employee_document->original_name.'"',
            ]
        );
    }

    /**
     * Resolve the path relative to the public disk root, or null if the file is missing.
     * Handles Windows-style separators and legacy values that include a "storage/" prefix.
     */
    private function resolveExistingPublicDiskDocumentPath(EmployeeDocument $document): ?string
    {
        $raw = $document->path;
        if (! is_string($raw) || $raw === '') {
            return null;
        }

        $normalized = str_replace('\\', '/', $raw);
        $normalized = ltrim($normalized, '/');

        $candidates = [$normalized];
        if (str_starts_with($normalized, 'storage/')) {
            $candidates[] = substr($normalized, strlen('storage/'));
        }

        $disk = Storage::disk('public');
        foreach (array_unique($candidates) as $candidate) {
            if ($candidate !== '' && $disk->exists($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    private function createEmployeeDocumentVersion(
        Employee $employee,
        DocumentType $documentType,
        string $path,
        string $originalName,
        mixed $expiryDate,
    ): EmployeeDocument {
        return DB::transaction(function () use ($employee, $documentType, $path, $originalName, $expiryDate): EmployeeDocument {
            $previousDocument = EmployeeDocument::query()
                ->where('employee_id', $employee->id)
                ->where('document_type_id', $documentType->id)
                ->orderByDesc('version_number')
                ->orderByDesc('id')
                ->first();

            if ($previousDocument !== null) {
                $previousDocument->update([
                    'status' => EmployeeDocument::STATUS_ARCHIVED,
                    'archived_at' => now(),
                ]);
            }

            return $employee->documents()->create([
                'document_type_id' => $documentType->id,
                'name' => $documentType->name,
                'path' => $path,
                'original_name' => $originalName,
                'expiry_date' => $this->normalizeDocumentExpiryDate($expiryDate),
                'status' => EmployeeDocument::STATUS_ACTIVE,
                'version_number' => (int) ($previousDocument?->version_number ?? 0) + 1,
                'archived_at' => null,
                'replaces_document_id' => $previousDocument?->id,
            ]);
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function approvedAssetPayload(Employee $employee): array
    {
        return ItAssetRequest::query()
            ->with([
                'issuedByEmployee:id,first_name,last_name',
                'hardwareItems.hardware:id,code,name',
                'hardwareItems.hardwareAssetValue:id,asset_model',
            ])
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->orderByDesc('decided_at')
            ->orderByDesc('id')
            ->get()
            ->map(function (ItAssetRequest $request): array {
                $hardwareItems = $this->valuation->resolvedHardwareItemsForDisplay($request);

                return [
                    'id' => (int) $request->id,
                    'code' => (string) $request->code,
                    'url' => route('it-asset-requests.show', $request, false),
                    'issued_date' => $request->date_issued?->toDateString(),
                    'approved_date' => $request->decided_at?->toDateString(),
                    'issued_by' => $request->issuedByEmployee !== null
                        ? trim($request->issuedByEmployee->first_name.' '.$request->issuedByEmployee->last_name)
                        : null,
                    'remarks' => $request->remarks,
                    'hardware_items' => $this->assetHardwareItems($hardwareItems),
                    'asset_totals' => $this->valuation->totalsForHardwareItems($hardwareItems),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $hardwareItems
     * @return array<int, array{hardware_id: int|null, hardware_code: string, hardware_name: string, asset_model: string|null, serial_number: string|null, asset_value: string|null, asset_currency: string|null}>
     */
    private function assetHardwareItems(array $hardwareItems): array
    {
        return array_map(
            fn (array $item): array => [
                'hardware_id' => $item['hardware']['id'] ?? $item['hardware_id'] ?? null,
                'hardware_code' => (string) ($item['hardware']['code'] ?? ''),
                'hardware_name' => (string) ($item['hardware']['name'] ?? ''),
                'asset_model' => $item['asset_model'] ?? null,
                'serial_number' => $item['serial_number'] ?? null,
                'asset_value' => $item['asset_value'] ?? null,
                'asset_currency' => $item['asset_currency'] ?? null,
            ],
            $hardwareItems
        );
    }

    private function normalizeDocumentExpiryDate(mixed $value): ?string
    {
        if (! filled($value)) {
            return null;
        }

        return Carbon::parse((string) $value)->toDateString();
    }

    /**
     * @return Builder<Employee>
     */
    private function scopedEmployeesQuery(?User $user = null): Builder
    {
        $user ??= request()->user();

        return $this->companyScope->scopeEmployees(Employee::query(), $user);
    }

    /**
     * @return Builder<Department>
     */
    private function scopedDepartmentsQuery(?User $user = null): Builder
    {
        $user ??= request()->user();

        if ($this->companyScope->isGlobalAdmin($user)) {
            return Department::query();
        }

        return $this->companyScope->scopeDepartmentsWithCompanyEmployees(Department::query(), $user);
    }

    /**
     * @return Builder<CompanyProfile>
     */
    private function scopedCompanyProfilesQuery(?User $user = null): Builder
    {
        $user ??= request()->user();
        $query = CompanyProfile::query();

        if ($this->companyScope->isGlobalAdmin($user)) {
            return $query;
        }

        $companyProfileId = $this->companyScope->companyProfileIdFor($user);

        if ($companyProfileId === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereKey($companyProfileId);
    }

    /**
     * @param  array<int, mixed>  $row
     */
    private function rowIsEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function normalizeHeader(string $header): string
    {
        $header = preg_replace('/^\xEF\xBB\xBF/u', '', $header) ?? $header;
        $header = ltrim($header, "\u{FEFF}");

        return mb_strtolower(trim($header));
    }

    private function buildEmployeeVCard(Employee $employee, string $appName): string
    {
        $lines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            'FN:'.$this->escapeVCard(trim($employee->first_name.' '.$employee->last_name)),
            'N:'.$this->escapeVCard((string) $employee->last_name).';'.$this->escapeVCard((string) $employee->first_name).';;;',
        ];

        $org = $employee->companyProfile?->company_name ?: $appName;
        if ($org !== '') {
            $lines[] = 'ORG:'.$this->escapeVCard($org);
        }

        if ($employee->jobPosition?->name) {
            $lines[] = 'TITLE:'.$this->escapeVCard($employee->jobPosition->name);
        }

        if ($employee->department?->name) {
            $lines[] = 'NOTE:Department: '.$this->escapeVCard($employee->department->name);
        }

        if ($employee->email_address) {
            $lines[] = 'EMAIL:'.$this->escapeVCard((string) $employee->email_address);
        }

        if ($employee->contact_number) {
            $lines[] = 'TEL;TYPE=WORK,VOICE:'.$this->escapeVCard((string) $employee->contact_number);
        }

        $lines[] = 'END:VCARD';

        return implode("\r\n", $lines);
    }

    private function escapeVCard(string $value): string
    {
        return str_replace(['\\', ';', ','], ['\\\\', '\;', '\,'], $value);
    }
}
