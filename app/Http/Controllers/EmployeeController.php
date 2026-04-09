<?php

namespace App\Http\Controllers;

use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateProfileRequest;
use App\Http\Requests\Employee\UpdateEmployeePrivateInformationRequest;
use App\Http\Requests\Employee\UploadProfileDocumentRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Http\Requests\Employee\ImportEmployeesRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Models\JobPosition;
use App\Models\WorkTimetable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Contracts\View\View as ViewContract;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeController extends Controller
{
    public function profile(Request $request): Response
    {
        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $employee = Employee::query()
            ->with(['department', 'jobPosition', 'companyProfile', 'workTimetable', 'documents'])
            ->where('user_id', $user->id)
            ->first();

        if ($employee === null) {
            abort(403);
        }

        $employee->photo_url = $employee->photo
            ? '/storage/'.ltrim($employee->photo, '/')
            : null;

        return Inertia::render('employees/profile', [
            'employee' => $employee,
        ]);
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

        $employee = Employee::query()->with('documents')->where('user_id', $user->id)->first();
        if ($employee === null) {
            abort(403);
        }

        $file = $request->file('document');
        if ($file === null) {
            return back()->with('error', 'Please select a document.');
        }

        $baseName = trim((string) ($request->input('name') ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)));
        $documentName = $baseName !== '' ? $baseName : 'Document';

        $existing = $employee->documents->firstWhere('name', $documentName);
        $path = $file->store("employees/{$employee->id}/documents", 'public');

        if ($existing !== null) {
            Storage::disk('public')->delete($existing->path);
            $existing->update([
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
            ]);
        } else {
            $employee->documents()->create([
                'name' => $documentName,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
            ]);
        }

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

    /**
     * Display a listing of the employees.
     */
    public function index(Request $request): Response
    {
        $hasUserActiveColumn = Schema::hasColumn('users', 'is_active');

        $employees = Employee::query()
            ->with([
                'department',
                'jobPosition',
                'user' => function ($query) use ($hasUserActiveColumn): void {
                    $query->select($hasUserActiveColumn ? ['id', 'is_active'] : ['id']);
                },
            ])
            ->when(
                $request->filled('department_id'),
                fn ($query) => $query->where('department_id', (int) $request->department_id)
            )
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($q) => $q->where('employee_code', 'like', '%'.$request->search.'%')
                        ->orWhere('first_name', 'like', '%'.$request->search.'%')
                        ->orWhere('last_name', 'like', '%'.$request->search.'%')
                        ->orWhere('email_address', 'like', '%'.$request->search.'%')
                        ->orWhere('contact_number', 'like', '%'.$request->search.'%')
                )
            )
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

        return Inertia::render('employees/index', [
            'employees' => $employees,
            'filters' => $request->only('search', 'department_id'),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for creating a new employee.
     */
    public function create(): Response
    {
        return Inertia::render('employees/create', [
            'departments' => Department::query()->orderBy('code')->get(['id', 'code', 'name']),
            'jobPositions' => JobPosition::query()->orderBy('code')->get(['id', 'code', 'name']),
            'companyProfiles' => CompanyProfile::query()->orderBy('company_name')->get(['id', 'company_name']),
            'workTimetables' => WorkTimetable::query()->orderBy('name')->get(['id', 'name']),
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

    public function export(): StreamedResponse
    {
        $callback = static function (): void {
            $stream = fopen('php://output', 'w');
            if ($stream === false) {
                return;
            }

            fputcsv($stream, [
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
            ]);

            Employee::query()
                ->with(['department:id,code,name', 'jobPosition:id,code,name', 'workTimetable:id,name', 'companyProfile:id,company_name'])
                ->orderBy('employee_code')
                ->chunk(500, static function ($employees) use ($stream): void {
                    foreach ($employees as $employee) {
                        fputcsv($stream, [
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
                        ]);
                    }
                });

            fclose($stream);
        };

        return response()->streamDownload($callback, 'employees-export.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function import(ImportEmployeesRequest $request): RedirectResponse
    {
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
            if ($companyNameKey !== '') {
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
        $documentLabels = $request->input('document_labels', []);
        unset($data['photo'], $data['documents'], $data['document_labels']);

        $data['role'] = 'Employee';

        $employee = Employee::query()->create($data);

        if ($photo) {
            $path = $photo->store("employees/{$employee->id}", 'public');
            $employee->update(['photo' => $path]);
        }

        foreach ($documents as $i => $file) {
            $path = $file->store("employees/{$employee->id}/documents", 'public');
            $label = trim($documentLabels[$i] ?? '') ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $employee->documents()->create([
                'name' => $label,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
            ]);
        }

        return to_route('employees.edit', $employee)->with('success', 'Employee updated successfully.');
    }

    /**
     * Display the employee business card (printable).
     */
    public function businessCard(Request $request, Employee $employee): Response
    {
        $employee->load(['department', 'jobPosition', 'companyProfile']);
        $employee->photo_url = $employee->photo
            ? '/storage/'.ltrim($employee->photo, '/')
            : null;
        if ($employee->relationLoaded('companyProfile') && $employee->companyProfile) {
            $employee->companyProfile->logo_url = $employee->companyProfile->logo
                ? '/storage/'.ltrim($employee->companyProfile->logo, '/')
                : null;
        }

        return Inertia::render('employees/business-card', [
            'employee' => $employee,
            'appName' => config('app.name'),
            'embedded' => $request->boolean('embed'),
        ]);
    }

    public function businessCardEmbed(Employee $employee): ViewContract
    {
        $employee->load(['department', 'jobPosition', 'companyProfile']);
        $employee->photo_url = $employee->photo
            ? '/storage/'.ltrim($employee->photo, '/')
            : null;
        if ($employee->relationLoaded('companyProfile') && $employee->companyProfile) {
            $employee->companyProfile->logo_url = $employee->companyProfile->logo
                ? '/storage/'.ltrim($employee->companyProfile->logo, '/')
                : null;
        }

        $appName = (string) config('app.name');
        $vCard = $this->buildEmployeeVCard($employee, $appName);
        $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=52x52&data='.rawurlencode($vCard);

        return view('employees.business-card-embed', [
            'employee' => $employee,
            'appName' => $appName,
            'qrCodeUrl' => $qrCodeUrl,
        ]);
    }

    /**
     * Show the form for editing the specified employee.
     */
    public function edit(Request $request, Employee $employee): Response
    {
        $hasUserActiveColumn = Schema::hasColumn('users', 'is_active');

        $employee->load([
            'department',
            'jobPosition',
            'documents',
            'companyProfile',
            'workTimetable',
            'user' => function ($query) use ($hasUserActiveColumn): void {
                $query->select($hasUserActiveColumn ? ['id', 'is_active'] : ['id']);
            },
        ]);
        $employee->photo_url = $employee->photo
            ? '/storage/'.ltrim($employee->photo, '/')
            : null;

        return Inertia::render('employees/edit', [
            'employee' => $employee,
            'departments' => Department::query()->orderBy('code')->get(['id', 'code', 'name']),
            'jobPositions' => JobPosition::query()->orderBy('code')->get(['id', 'code', 'name']),
            'companyProfiles' => CompanyProfile::query()->orderBy('company_name')->get(['id', 'company_name']),
            'workTimetables' => WorkTimetable::query()->orderBy('name')->get(['id', 'name']),
            'viewMode' => $request->query('mode') === 'view',
            'employeeLoginActive' => $employee->user?->is_active ?? null,
        ]);
    }

    /**
     * Update the specified employee.
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $data = $request->validated();
        $userActive = $data['user_active'] ?? null;
        $photo = $data['photo'] ?? null;
        $documents = $data['documents'] ?? [];
        $documentLabels = $request->input('document_labels', []);
        unset($data['photo'], $data['documents'], $data['document_labels'], $data['user_active']);

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
            $label = trim($documentLabels[$i] ?? '') ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $employee->documents()->create([
                'name' => $label,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
            ]);
        }

        if (Schema::hasColumn('users', 'is_active') && $employee->user_id !== null && $userActive !== null) {
            $employee->user()->update(['is_active' => (bool) $userActive]);
        }

        $tab = $request->input('tab');
        if (! in_array($tab, ['employee_information', 'work_information', 'documents', 'private_information'], true)) {
            $tab = 'employee_information';
        }

        return to_route('employees.edit', [
            'employee' => $employee,
            'tab' => $tab,
        ])->with('success', 'Employee updated successfully.');
    }

    public function updatePrivateInformation(UpdateEmployeePrivateInformationRequest $request, Employee $employee): RedirectResponse
    {
        $employee->update($request->validated());

        return to_route('employees.edit', $employee)->with('success', 'Private information updated.');
    }

    /**
     * Remove the specified employee.
     */
    public function destroy(Employee $employee): RedirectResponse
    {
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
    public function destroyDocument(Employee $employee, EmployeeDocument $employeeDocument): RedirectResponse
    {
        if ($employeeDocument->employee_id !== $employee->id) {
            abort(404);
        }
        $path = str_replace('\\', '/', $employeeDocument->path);
        Storage::disk('public')->delete($employeeDocument->path);
        Storage::disk('public')->delete($path);
        Storage::disk('public')->deleteDirectory("employees/{$employee->id}/documents");
        $employeeDocument->delete();

        return back();
    }

    public function showDocument(Employee $employee, EmployeeDocument $employeeDocument): BinaryFileResponse
    {
        if ($employeeDocument->employee_id !== $employee->id) {
            abort(404);
        }

        if (! Storage::disk('public')->exists($employeeDocument->path)) {
            abort(404, 'Document file not found.');
        }

        return response()->file(
            Storage::disk('public')->path($employeeDocument->path),
            [
                'Content-Disposition' => 'inline; filename="'.$employeeDocument->original_name.'"',
            ]
        );
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
