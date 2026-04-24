<?php

namespace App\Http\Controllers;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Requests\EmployeeRequest\StoreEmployeeRequestRequest;
use App\Http\Requests\EmployeeRequest\UpdateEmployeeRequestRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeRequest;
use App\Models\JobPosition;
use App\Models\RequestEmailLog;
use App\Models\User;
use App\Notifications\RequestDecisionNotification;
use App\Notifications\RequestSubmittedNotification;
use App\Support\EmployeePhotoUrl;
use App\Support\RequestApprovalScope;
use App\Support\RequestDecisionNotificationPayload;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeRequestController extends Controller
{
    public function __construct(private readonly RequestApprovalScope $approvalScope) {}

    /**
     * Display a listing of the employee requests.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'department_id' => ['sometimes', 'nullable', 'integer', 'exists:departments,id'],
            'status' => ['sometimes', 'nullable', 'string', 'max:50'],
            'date_preset' => ['sometimes', 'nullable', 'string', Rule::in(['today', 'yesterday', 'last_7_days', 'this_month', 'custom'])],
            'date_from' => ['sometimes', 'nullable', 'date'],
            'date_to' => ['sometimes', 'nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $departmentId = isset($validated['department_id']) ? (int) $validated['department_id'] : null;
        $statusFilter = isset($validated['status']) && $validated['status'] !== ''
            ? $validated['status']
            : null;
        $datePreset = isset($validated['date_preset']) && $validated['date_preset'] !== ''
            ? $validated['date_preset']
            : null;
        $dateFrom = isset($validated['date_from']) && $validated['date_from'] !== ''
            ? $validated['date_from']
            : null;
        $dateTo = isset($validated['date_to']) && $validated['date_to'] !== ''
            ? $validated['date_to']
            : null;

        $visibleRequests = EmployeeRequest::query()
            ->with(['employee.companyProfile:id,company_name', 'department', 'jobPosition'])
            ->tap(fn ($query) => $this->approvalScope->scopeVisible($query, $request->user()))
            ->when(isset($validated['search']) && trim((string) $validated['search']) !== '', function ($query) use ($validated): void {
                $search = (string) $validated['search'];
                $query->whereHas('employee', function ($q) use ($search): void {
                    $q->where('first_name', 'like', '%'.$search.'%')
                        ->orWhere('last_name', 'like', '%'.$search.'%');
                });
            })
            ->when(
                $departmentId !== null,
                fn ($query) => $query->where('department_id', $departmentId)
            )
            ->when(
                $statusFilter !== null,
                fn ($query) => $query->where('status', $statusFilter)
            );

        $this->applyDatePresetFilter($visibleRequests, $datePreset, $dateFrom, $dateTo);

        $statusCounts = (clone $visibleRequests)
            ->select('status')
            ->get()
            ->countBy(fn (EmployeeRequest $row): string => strtolower((string) $row->status));

        $employeeRequests = (clone $visibleRequests)
            ->orderByDesc('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('employee-requests/index', [
            'employeeRequests' => $employeeRequests,
            'filters' => [
                'search' => $validated['search'] ?? null,
                'department_id' => $departmentId,
                'status' => $statusFilter,
                'date_preset' => $datePreset,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'stats' => [
                'total' => $statusCounts->sum(),
                'draft' => (int) $statusCounts->get('draft', 0),
                'submitted' => (int) $statusCounts->get('submitted', 0),
                'approved' => (int) $statusCounts->get('approved', 0),
                'rejected' => (int) $statusCounts->get('rejected', 0),
            ],
        ]);
    }

    private function applyDatePresetFilter(
        Builder $query,
        mixed $datePreset,
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): void {
        if (! is_string($datePreset) || $datePreset === '') {
            return;
        }

        $today = Carbon::today();

        if ($datePreset === 'today') {
            $query->whereDate('date', $today);

            return;
        }

        if ($datePreset === 'yesterday') {
            $query->whereDate('date', $today->copy()->subDay());

            return;
        }

        if ($datePreset === 'last_7_days') {
            $query->whereBetween('date', [
                $today->copy()->subDays(6)->startOfDay(),
                $today->copy()->endOfDay(),
            ]);

            return;
        }

        if ($datePreset === 'this_month') {
            $query->whereBetween('date', [
                $today->copy()->startOfMonth(),
                $today->copy()->endOfMonth(),
            ]);

            return;
        }

        if ($datePreset === 'custom') {
            if ($dateFrom !== null) {
                $query->whereDate('date', '>=', $dateFrom);
            }
            if ($dateTo !== null) {
                $query->whereDate('date', '<=', $dateTo);
            }
        }
    }

    /**
     * Show the form for creating a new employee request.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('employee-requests/create', [
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'department_id', 'job_position_id']),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'jobPositions' => JobPosition::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'defaultEmployeeId' => $request->user()?->employee?->id,
        ]);
    }

    /**
     * Store a newly created employee request.
     */
    public function store(StoreEmployeeRequestRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $employeeRequest = EmployeeRequest::query()->create([
            'employee_id' => $data['employee_id'],
            'job_position_id' => $data['job_position_id'],
            'department_id' => $data['department_id'],
            'date' => $data['date'],
            'date_of_joining' => $data['date_of_joining'],
            'departure_date' => $data['departure_date'] ?? null,
            'arrival_date' => $data['arrival_date'] ?? null,
            'preferred_airlines' => $data['preferred_airlines'] ?? null,
            'last_encashment_date' => $data['last_encashment_date'] ?? null,
            'bag_allowance' => $data['bag_allowance'] ?? null,
            'ticket_booking' => (bool) ($data['ticket_booking'] ?? false),
            'passport_request' => (bool) ($data['passport_request'] ?? false),
            'ticket_encashment' => (bool) ($data['ticket_encashment'] ?? false),
            'amount_2000' => (bool) ($data['amount_2000'] ?? false),
            'amount_1000' => (bool) ($data['amount_1000'] ?? false),
            'leave_salary' => $data['leave_salary'] ?? null,
            'passport_ack_airline_name' => $data['passport_ack_airline_name'] ?? null,
            'passport_ack_home_country' => $data['passport_ack_home_country'] ?? null,
            'passport_ack_departure_date_time' => $data['passport_ack_departure_date_time'] ?? null,
            'passport_ack_home_country_departure_date_time' => $data['passport_ack_home_country_departure_date_time'] ?? null,
            'status' => 'draft',
        ]);

        $signaturePath = $this->storeSignatureFromDataUrl(
            $data['employee_signature_data_url'] ?? null,
            "employee-requests/{$employeeRequest->id}/signatures"
        );
        if ($signaturePath !== null) {
            $employeeRequest->update(['employee_signature' => $signaturePath]);
        }

        return to_route('employee-requests.show', $employeeRequest);
    }

    /**
     * Display the specified employee request.
     */
    public function show(EmployeeRequest $employee_request): Response
    {
        $actor = request()->user();
        $this->assertCanView($actor, $employee_request);
        $employee_request->load(['employee', 'department', 'jobPosition', 'approvedByEmployee']);
        $canViewActivityLogs = $actor?->hasModuleAbility(PermissionModule::ActivityLogs, ModuleAbility::View) ?? false;

        $employeeSignatureUrl = $employee_request->employee_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($employee_request->employee_signature, '/'))
            : null;
        $ceoSignatureUrl = $employee_request->ceo_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($employee_request->ceo_signature, '/'))
            : null;
        $approvedBySignatureUrl = $employee_request->approved_by_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($employee_request->approved_by_signature, '/'))
            : null;

        return Inertia::render('employee-requests/show', [
            'employeeRequest' => array_merge($employee_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'ceo_signature_url' => $ceoSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
            ]),
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
            'signaturesUrl' => $this->employeeRequestSignaturesPostUrl($employee_request),
            'submitUrl' => route('employee-requests.submit', $employee_request, false),
            'cancelUrl' => route('employee-requests.destroy', $employee_request, false),
            'decisionUrl' => route('employee-requests.decide', $employee_request, false),
            'canDecide' => $this->approvalScope->canDecide($actor, $employee_request->employee_id, $employee_request->department_id, (string) $employee_request->status),
            'canCancel' => $this->canCancel($actor, $employee_request),
            'canEdit' => $this->canEdit($actor, $employee_request),
            'canViewActivityLogs' => $canViewActivityLogs,
            'activityLogs' => $canViewActivityLogs ? $this->activityLogsForEmployeeRequest($employee_request) : [],
            'emailLogs' => $this->emailLogsForRequest('employee_request', (int) $employee_request->id),
        ]);
    }

    /**
     * Submit a draft employee request.
     */
    public function submit(EmployeeRequest $employee_request): RedirectResponse
    {
        $this->assertCanModify(request()->user(), $employee_request);
        if (strtolower((string) $employee_request->status) !== 'draft') {
            return redirect()->back()->with('error', 'Only draft employee requests can be submitted.');
        }

        $employee_request->update(['status' => 'submitted']);
        $employee_request->loadMissing('employee');
        $this->notifyApprovers(
            request()->user(),
            $employee_request->department_id,
            [
                'request_type' => 'employee_request',
                'request_id' => $employee_request->id,
                'request_code' => $employee_request->code,
                'request_date' => (string) (optional($employee_request->date)->format('Y-m-d') ?? $employee_request->created_at?->format('Y-m-d') ?? ''),
                'submitted_by' => $employee_request->employee
                    ? trim($employee_request->employee->first_name.' '.$employee_request->employee->last_name)
                    : 'Employee',
                'route' => route('employee-requests.show', $employee_request),
                'employee_photo_url' => EmployeePhotoUrl::forPublicDisk($employee_request->employee),
            ]
        );

        return redirect()
            ->route('employee-requests.index')
            ->with('success', 'Employee request submitted.');
    }

    public function decide(Request $request, EmployeeRequest $employee_request): RedirectResponse
    {
        if (! $this->approvalScope->canDecide($request->user(), $employee_request->employee_id, $employee_request->department_id, (string) $employee_request->status)) {
            abort(403);
        }

        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'remarks' => ['nullable', 'string', 'max:2000', 'required_if:decision,rejected'],
        ]);

        if ($validated['decision'] === 'approved' && blank($employee_request->approved_by_signature)) {
            return redirect()->back()->with('error', 'Please save your manager or HR signature before approving this request.');
        }

        $approverEmployeeId = $request->user()?->employee?->id;
        $remarks = isset($validated['remarks']) ? trim((string) $validated['remarks']) : null;
        $employee_request->update([
            'status' => $validated['decision'],
            'decision_remarks' => $remarks !== '' ? $remarks : null,
            'decided_at' => now(),
            'approved_by_employee_id' => $approverEmployeeId,
        ]);

        $employee_request->loadMissing('employee.user');
        $requester = $employee_request->employee?->user;
        if ($requester !== null && $requester->id !== $request->user()?->id) {
            $requester->notify(new RequestDecisionNotification(
                RequestDecisionNotificationPayload::make(
                    'employee_request',
                    $employee_request->id,
                    $employee_request->code,
                    (string) (optional($employee_request->date)->format('Y-m-d') ?? $employee_request->created_at?->format('Y-m-d') ?? ''),
                    $validated['decision'],
                    $employee_request->decision_remarks,
                    $employee_request->decided_at,
                    route('employee-requests.show', $employee_request),
                    EmployeePhotoUrl::forPublicDisk($request->user()?->employee),
                )
            ));
        }

        return redirect()->back()->with('success', 'Decision submitted successfully.');
    }

    /**
     * Show the form for editing the specified employee request.
     */
    public function edit(EmployeeRequest $employee_request): Response
    {
        $actor = request()->user();
        $this->assertCanModify($actor, $employee_request);
        $this->assertEditableStatus($employee_request);
        $employee_request->load(['employee', 'department', 'jobPosition', 'approvedByEmployee']);
        $canViewActivityLogs = $actor?->hasModuleAbility(PermissionModule::ActivityLogs, ModuleAbility::View) ?? false;

        $employeeSignatureUrl = $employee_request->employee_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($employee_request->employee_signature, '/'))
            : null;
        $ceoSignatureUrl = $employee_request->ceo_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($employee_request->ceo_signature, '/'))
            : null;
        $approvedBySignatureUrl = $employee_request->approved_by_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($employee_request->approved_by_signature, '/'))
            : null;

        return Inertia::render('employee-requests/edit', [
            'employeeRequest' => array_merge($employee_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'ceo_signature_url' => $ceoSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
            ]),
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'department_id', 'job_position_id']),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'jobPositions' => JobPosition::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'signaturesUrl' => $this->employeeRequestSignaturesPostUrl($employee_request),
            'cancelUrl' => route('employee-requests.destroy', $employee_request, false),
            'canDecide' => $this->approvalScope->canDecide($actor, $employee_request->employee_id, $employee_request->department_id, (string) $employee_request->status),
            'canCancel' => $this->canCancel($actor, $employee_request),
            'canViewActivityLogs' => $canViewActivityLogs,
            'activityLogs' => $canViewActivityLogs ? $this->activityLogsForEmployeeRequest($employee_request) : [],
            'emailLogs' => $this->emailLogsForRequest('employee_request', (int) $employee_request->id),
        ]);
    }

    /**
     * Update the specified employee request.
     */
    public function update(UpdateEmployeeRequestRequest $request, EmployeeRequest $employee_request): RedirectResponse
    {
        $this->assertCanModify($request->user(), $employee_request);
        $this->assertEditableStatus($employee_request);
        $data = $request->validated();

        $status = $data['status'] ?? $employee_request->status;

        $employee_request->update([
            'employee_id' => $data['employee_id'],
            'job_position_id' => $data['job_position_id'],
            'department_id' => $data['department_id'],
            'date' => $data['date'],
            'date_of_joining' => $data['date_of_joining'],
            'departure_date' => $data['departure_date'] ?? null,
            'arrival_date' => $data['arrival_date'] ?? null,
            'preferred_airlines' => $data['preferred_airlines'] ?? null,
            'last_encashment_date' => $data['last_encashment_date'] ?? null,
            'bag_allowance' => $data['bag_allowance'] ?? null,
            'ticket_booking' => (bool) ($data['ticket_booking'] ?? false),
            'passport_request' => (bool) ($data['passport_request'] ?? false),
            'ticket_encashment' => (bool) ($data['ticket_encashment'] ?? false),
            'amount_2000' => (bool) ($data['amount_2000'] ?? false),
            'amount_1000' => (bool) ($data['amount_1000'] ?? false),
            'leave_salary' => $data['leave_salary'] ?? null,
            'passport_ack_airline_name' => $data['passport_ack_airline_name'] ?? null,
            'passport_ack_home_country' => $data['passport_ack_home_country'] ?? null,
            'passport_ack_departure_date_time' => $data['passport_ack_departure_date_time'] ?? null,
            'passport_ack_home_country_departure_date_time' => $data['passport_ack_home_country_departure_date_time'] ?? null,
            'status' => $status,
        ]);

        return to_route('employee-requests.index');
    }

    /**
     * Printable employee request (matches leave request print styling).
     */
    public function print(EmployeeRequest $employee_request): Response
    {
        $this->assertCanView(request()->user(), $employee_request);
        $employee_request->load(['employee.companyProfile', 'department', 'jobPosition', 'approvedByEmployee']);

        $company = $employee_request->employee?->companyProfile ?? CompanyProfile::query()->first();
        $companyLogoUrl = $this->publicStorageBrowserUrl($company?->logo);

        $employeeSignatureUrl = $this->publicStorageBrowserUrl($employee_request->employee_signature);
        $ceoSignatureUrl = $this->publicStorageBrowserUrl($employee_request->ceo_signature);
        $approvedBySignatureUrl = $this->publicStorageBrowserUrl($employee_request->approved_by_signature);

        $approvedByName = '';
        if ($employee_request->approvedByEmployee) {
            $approvedByName = trim($employee_request->approvedByEmployee->first_name.' '.$employee_request->approvedByEmployee->last_name);
        }

        return Inertia::render('employee-requests/print', [
            'employeeRequest' => array_merge($employee_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'ceo_signature_url' => $ceoSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
                'approved_by_name' => $approvedByName,
            ]),
            'companyLogoUrl' => $companyLogoUrl,
        ]);
    }

    /**
     * Cancel the specified employee request.
     */
    public function destroy(EmployeeRequest $employee_request): RedirectResponse
    {
        $actor = request()->user();
        $status = strtolower((string) $employee_request->status);

        if ($status === 'draft') {
            $this->assertCanModify($actor, $employee_request);
        } elseif (in_array($status, ['submitted', 'approved'], true)) {
            if ($actor === null || ! $actor->isAdministrator()) {
                abort(403);
            }
        } else {
            return redirect()->back()->with('error', 'Only draft, submitted, or approved requests can be cancelled.');
        }

        if ($status === 'cancelled') {
            return redirect()->back()->with('success', 'Employee request is already cancelled.');
        }

        $employee_request->update([
            'status' => 'cancelled',
            'decided_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Employee request cancelled successfully.');
    }

    /**
     * Update signatures for the Employee request.
     */
    public function updateSignatures(Request $request, EmployeeRequest $employee_request): RedirectResponse
    {
        $this->assertCanModify($request->user(), $employee_request);
        if (strtolower((string) $employee_request->status) !== 'draft' && $request->hasFile('employee_signature')) {
            return redirect()->back()->with('error', 'Employee signature cannot be changed after submission.');
        }
        if (strtolower((string) $employee_request->status) !== 'submitted' && $request->hasFile('approved_by_signature')) {
            return redirect()->back()->with('error', 'Manager/HR signature cannot be changed after decision.');
        }
        $request->validate([
            'employee_signature' => ['nullable', 'image', 'max:2048'],
            'approved_by_signature' => ['nullable', 'image', 'max:2048'],
            'ceo_signature' => ['nullable', 'image', 'max:2048'],
            'approved_by_employee_id' => ['nullable', 'integer', 'exists:'.Employee::class.',id'],
        ]);

        $updateData = [];

        if ($request->hasFile('employee_signature')) {
            if ($employee_request->employee_signature) {
                Storage::disk('public')->delete($employee_request->employee_signature);
            }
            $path = $request->file('employee_signature')->store(
                "employee-requests/{$employee_request->id}/signatures",
                'public',
            );
            $updateData['employee_signature'] = $path;
        }

        if ($request->hasFile('approved_by_signature')) {
            if ($employee_request->approved_by_signature) {
                Storage::disk('public')->delete($employee_request->approved_by_signature);
            }
            $path = $request->file('approved_by_signature')->store(
                "employee-requests/{$employee_request->id}/signatures",
                'public',
            );
            $updateData['approved_by_signature'] = $path;
        }

        if ($request->hasFile('ceo_signature')) {
            if ($employee_request->ceo_signature) {
                Storage::disk('public')->delete($employee_request->ceo_signature);
            }
            $path = $request->file('ceo_signature')->store(
                "employee-requests/{$employee_request->id}/signatures",
                'public',
            );
            $updateData['ceo_signature'] = $path;
        }

        if ($request->filled('approved_by_employee_id')) {
            $updateData['approved_by_employee_id'] = $request->input('approved_by_employee_id');
        }

        if (! empty($updateData)) {
            $employee_request->update($updateData);
        }

        return redirect()->back()->with('success', 'Signatures updated successfully.');
    }

    private function storeSignatureFromDataUrl(?string $dataUrl, string $directory): ?string
    {
        if ($dataUrl === null || $dataUrl === '') {
            return null;
        }

        if (! preg_match('/^data:image\/png;base64,(.+)$/', $dataUrl, $matches)) {
            return null;
        }

        $binary = base64_decode($matches[1], true);
        if ($binary === false || $binary === '') {
            return null;
        }

        $path = $directory.'/signature-'.uniqid().'.png';
        Storage::disk('public')->put($path, $binary);

        return $path;
    }

    /**
     * POST URL for saving employee request signatures (host-relative).
     */
    private function employeeRequestSignaturesPostUrl(EmployeeRequest $employee_request): string
    {
        $key = $employee_request->getKey();
        if ($key === null || $key === '') {
            $key = request()->segment(2);
        }

        return '/employee-requests/'.$key.'/signatures';
    }

    /**
     * Host-relative URL for files stored on the public disk.
     */
    private function publicStorageBrowserUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        return '/storage/'.str_replace('\\', '/', ltrim($path, '/'));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function activityLogsForEmployeeRequest(EmployeeRequest $employeeRequest): array
    {
        return $employeeRequest->activityLogs()
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
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function emailLogsForRequest(string $requestType, int $requestId): array
    {
        return RequestEmailLog::query()
            ->where('request_type', $requestType)
            ->where('request_id', $requestId)
            ->latest('performed_at')
            ->limit(100)
            ->get()
            ->map(fn (RequestEmailLog $log): array => [
                'id' => (int) $log->id,
                'status' => (string) $log->status,
                'channel' => (string) $log->channel,
                'notification_type' => (string) $log->notification_type,
                'recipient_email' => (string) $log->recipient_email,
                'reason' => $log->reason,
                'error_message' => $log->error_message,
                'performed_at' => $log->performed_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    private function assertCanView(?User $user, EmployeeRequest $employeeRequest): void
    {
        if (! $this->approvalScope->canView($user, $employeeRequest->employee_id, $employeeRequest->department_id)) {
            abort(403);
        }
    }

    private function assertCanModify(?User $user, EmployeeRequest $employeeRequest): void
    {
        if (! $this->approvalScope->canModify($user, $employeeRequest->employee_id, $employeeRequest->department_id, (string) $employeeRequest->status)) {
            abort(403);
        }
    }

    private function canCancel(?User $user, EmployeeRequest $employeeRequest): bool
    {
        if ($user === null) {
            return false;
        }

        $status = strtolower((string) $employeeRequest->status);
        if ($status === 'cancelled') {
            return false;
        }

        if ($status === 'draft') {
            return $this->approvalScope->canModify($user, $employeeRequest->employee_id, $employeeRequest->department_id, (string) $employeeRequest->status);
        }

        if (in_array($status, ['submitted', 'approved'], true)) {
            return $user->isAdministrator();
        }

        return false;
    }

    private function canEdit(?User $user, EmployeeRequest $employeeRequest): bool
    {
        if ($user === null) {
            return false;
        }

        return strtolower((string) $employeeRequest->status) === 'draft'
            && $this->approvalScope->canModify($user, $employeeRequest->employee_id, $employeeRequest->department_id, (string) $employeeRequest->status);
    }

    private function assertEditableStatus(EmployeeRequest $employeeRequest): void
    {
        if (strtolower((string) $employeeRequest->status) !== 'draft') {
            abort(403);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function notifyApprovers(?User $actor, int $departmentId, array $payload): void
    {
        $recipients = collect($this->approvalScope->hrUsers());
        $manager = $this->approvalScope->managerUserByDepartmentId($departmentId);
        if ($manager !== null) {
            $recipients->push($manager);
        }

        $uniqueRecipients = $recipients
            ->filter(fn ($user) => $user instanceof User)
            ->filter(fn (User $user) => $actor === null || $user->id !== $actor->id)
            ->unique('id');

        foreach ($uniqueRecipients as $recipient) {
            $recipient->notify(new RequestSubmittedNotification($payload));
        }
    }
}
