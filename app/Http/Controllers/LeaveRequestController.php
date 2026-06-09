<?php

namespace App\Http\Controllers;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Requests\LeaveRequest\StoreLeaveRequestRequest;
use App\Http\Requests\LeaveRequest\UpdateLeaveRequestRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveRequestActivityLog;
use App\Models\LeaveType;
use App\Models\RequestEmailLog;
use App\Models\User;
use App\Notifications\RequestDecisionNotification;
use App\Notifications\RequestSubmittedNotification;
use App\Support\CompanyAccessScope;
use App\Support\EmployeePhotoUrl;
use App\Support\RequestApprovalScope;
use App\Support\RequestDecisionNotificationPayload;
use App\Support\RequestFormEmployeeSelection;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
    public function __construct(
        private readonly RequestApprovalScope $approvalScope,
        private readonly CompanyAccessScope $companyScope,
        private readonly RequestFormEmployeeSelection $requestFormEmployees,
    ) {}

    /**
     * Display a listing of the leave requests.
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

        $departmentId = $validated['department_id'] ?? null;
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

        $applyFilters = function ($query) use ($request, $departmentId, $statusFilter, $datePreset, $dateFrom, $dateTo): void {
            $query->when(
                $request->filled('search'),
                fn ($q) => $q->whereHas('employee', function ($sub) use ($request): void {
                    $sub->where('first_name', 'like', '%'.$request->search.'%')
                        ->orWhere('last_name', 'like', '%'.$request->search.'%');
                })
            )
                ->when($departmentId !== null, fn ($q) => $q->where('department_id', $departmentId))
                ->when($statusFilter !== null && $statusFilter !== '', fn ($q) => $q->where('status', $statusFilter))
                ->when($datePreset === 'today', fn ($q) => $q->whereDate('created_at', Carbon::today()))
                ->when($datePreset === 'yesterday', fn ($q) => $q->whereDate('created_at', Carbon::yesterday()))
                ->when($datePreset === 'last_7_days', fn ($q) => $q->where(
                    'created_at',
                    '>=',
                    Carbon::today()->subDays(6)->startOfDay()
                ))
                ->when($datePreset === 'this_month', function ($q): void {
                    $q->whereBetween('created_at', [
                        Carbon::now()->startOfMonth()->startOfDay(),
                        Carbon::now()->endOfMonth()->endOfDay(),
                    ]);
                })
                ->when($datePreset === 'custom', function ($q) use ($dateFrom, $dateTo): void {
                    if ($dateFrom !== null) {
                        $q->whereDate('created_at', '>=', $dateFrom);
                    }
                    if ($dateTo !== null) {
                        $q->whereDate('created_at', '<=', $dateTo);
                    }
                });
        };

        $statusAggregation = LeaveRequest::query();
        $this->approvalScope->scopeVisible($statusAggregation, $request->user());
        $applyFilters($statusAggregation);

        $statusRows = $statusAggregation
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->get();

        $byStatus = [];
        foreach ($statusRows as $row) {
            $byStatus[$row->status] = (int) $row->aggregate;
        }

        $stats = [
            'total' => array_sum($byStatus),
            'draft' => $byStatus['draft'] ?? 0,
            'submitted' => $byStatus['submitted'] ?? 0,
            'approved' => $byStatus['approved'] ?? 0,
            'rejected' => $byStatus['rejected'] ?? 0,
        ];

        $leaveRequests = LeaveRequest::query();
        $this->approvalScope->scopeVisible($leaveRequests, $request->user());
        $applyFilters($leaveRequests);

        $leaveRequests = $leaveRequests
            ->with(['employee.companyProfile:id,company_name', 'department'])
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('leave-requests/index', [
            'leaveRequests' => $leaveRequests,
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
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new leave request.
     */
    public function create(Request $request): Response
    {
        $canViewActivityLogs = $request->user()?->hasModuleAbility(PermissionModule::ActivityLogs, ModuleAbility::View) ?? false;
        $user = $request->user();
        $employees = $this->requestFormEmployees->employeesForForm($user, [
            'id', 'first_name', 'last_name', 'department_id', 'leave_opening_balance',
        ])->load('department:id,name');

        $leaveBalanceByEmployeeId = $employees
            ->mapWithKeys(fn (Employee $employee): array => [
                (string) $employee->id => round($this->availableLeaveBalanceForEmployee($employee), 2),
            ])
            ->all();

        return Inertia::render('leave-requests/create', [
            'employees' => $employees
                ->map(fn (Employee $employee): array => [
                    'id' => $employee->id,
                    'first_name' => $employee->first_name,
                    'last_name' => $employee->last_name,
                    'department_id' => $employee->department_id,
                    'department' => $employee->department,
                ])
                ->values(),
            'leaveBalanceByEmployeeId' => $leaveBalanceByEmployeeId,
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'leaveTypes' => $this->availableLeaveTypeNames(),
            'defaultEmployeeId' => $user?->loadMissing('employee')->employee?->id,
            'canChooseEmployee' => $this->requestFormEmployees->canChooseEmployee($user),
            'canViewActivityLogs' => $canViewActivityLogs,
            'activityLogs' => [],
        ]);
    }

    /**
     * Store a newly created leave request.
     */
    public function store(StoreLeaveRequestRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $startDayType = $data['start_day_type'] ?? 'full';
        $endDayType = $data['end_day_type'] ?? 'full';

        $days = $this->computeDays(
            $data['period_from'] ?? null,
            $data['period_to'] ?? null,
            $startDayType,
            $endDayType,
        );

        $leaveRequest = LeaveRequest::query()->create([
            'employee_id' => $data['employee_id'],
            'department_id' => $data['department_id'],
            'absence_types' => [$data['absence_type']],
            'absence_other' => $data['absence_other'] ?? null,
            'details' => ! empty($data['details']) ? $data['details'] : null,
            'date' => $data['date'] ?? null,
            'period_from' => $data['period_from'] ?? null,
            'start_day_type' => $startDayType,
            'period_to' => $data['period_to'] ?? null,
            'end_day_type' => $endDayType,
            'days' => $days,
            'remarks' => ! empty($data['remarks']) ? $data['remarks'] : null,
            'status' => 'draft',
        ]);

        $signaturePath = $this->storeSignatureFromDataUrl(
            $data['employee_signature_data_url'] ?? null,
            "leave-requests/{$leaveRequest->id}/signatures"
        );
        if ($signaturePath !== null) {
            $leaveRequest->update(['employee_signature' => $signaturePath]);
        }

        return to_route('leave-requests.show', $leaveRequest);
    }

    /**
     * Display the specified leave request.
     */
    public function show(LeaveRequest $leave_request): Response
    {
        $actor = request()->user();
        $this->assertCanView($actor, $leave_request);
        $leave_request->load(['employee', 'department', 'approvedByEmployee']);
        $canViewActivityLogs = $actor?->hasModuleAbility(PermissionModule::ActivityLogs, ModuleAbility::View) ?? false;

        $employeeSignatureUrl = $this->publicStorageBrowserUrl($leave_request->employee_signature);
        $approvedBySignatureUrl = $this->publicStorageBrowserUrl($leave_request->approved_by_signature);

        return Inertia::render('leave-requests/show', [
            'leaveRequest' => array_merge($leave_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
            ]),
            'employees' => $this->companyScope->employeesForRequestForms($actor, [
                'id', 'first_name', 'last_name',
            ]),
            'signaturesUrl' => $this->leaveRequestSignaturesPostUrl($leave_request),
            'submitUrl' => route('leave-requests.submit', $leave_request, false),
            'cancelUrl' => route('leave-requests.destroy', $leave_request, false),
            'decisionUrl' => route('leave-requests.decide', $leave_request, false),
            'canDecide' => $this->approvalScope->canDecide($actor, $leave_request->employee_id, $leave_request->department_id, (string) $leave_request->status),
            'canCancel' => $this->canCancel($actor, $leave_request),
            'canEdit' => $this->canEdit($actor, $leave_request),
            'canViewActivityLogs' => $canViewActivityLogs,
            'activityLogs' => $canViewActivityLogs ? $this->activityLogsForLeaveRequest($leave_request) : [],
            'emailLogs' => $this->emailLogsForRequest('leave_request', (int) $leave_request->id),
        ]);
    }

    /**
     * Submit a draft leave request for processing.
     */
    public function submit(LeaveRequest $leave_request): RedirectResponse
    {
        $this->assertCanModify(request()->user(), $leave_request);
        if (strtolower((string) $leave_request->status) !== 'draft') {
            return redirect()->back()->with('error', 'Only draft leave requests can be submitted.');
        }

        $leave_request->loadMissing('employee');
        $employee = $leave_request->employee;
        if ($employee === null) {
            return redirect()->back()->with('error', 'Cannot submit: employee record is missing.');
        }

        $requestedDays = (float) ($leave_request->days ?? 0);
        if ($requestedDays <= 0) {
            return redirect()->back()->with('error', 'Cannot submit: leave request days must be set.');
        }

        if ($this->isPaidLeaveRequest($leave_request)) {
            $availableRemaining = $this->availableLeaveBalanceForEmployee($employee);
            if ($requestedDays > $availableRemaining) {
                return redirect()->back()->with(
                    'error',
                    sprintf(
                        'Cannot submit: requested %.2f day(s) exceeds available balance %.2f day(s).',
                        $requestedDays,
                        $availableRemaining
                    )
                );
            }
        }

        $leave_request->update(['status' => 'submitted']);
        $leave_request->loadMissing('employee');
        $this->notifyApprovers(
            request()->user(),
            $leave_request->department_id,
            [
                'request_type' => 'leave_request',
                'request_id' => $leave_request->id,
                'request_code' => $leave_request->code,
                'request_date' => (string) ($leave_request->date ?? $leave_request->created_at?->format('Y-m-d') ?? ''),
                'submitted_by' => $leave_request->employee
                    ? trim($leave_request->employee->first_name.' '.$leave_request->employee->last_name)
                    : 'Employee',
                'route' => route('leave-requests.show', $leave_request),
                'employee_photo_url' => EmployeePhotoUrl::forPublicDisk($leave_request->employee),
            ]
        );

        return redirect()
            ->route('leave-requests.index')
            ->with('success', 'Leave request submitted.');
    }

    public function decide(Request $request, LeaveRequest $leave_request): RedirectResponse
    {
        if (! $this->approvalScope->canDecide($request->user(), $leave_request->employee_id, $leave_request->department_id, (string) $leave_request->status)) {
            abort(403);
        }

        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'remarks' => ['nullable', 'string', 'max:2000', 'required_if:decision,rejected'],
        ]);

        if ($validated['decision'] === 'approved' && blank($leave_request->approved_by_signature)) {
            return redirect()->back()->with('error', 'Please save your manager or HR signature before approving this request.');
        }

        $approverEmployeeId = $request->user()?->employee?->id;
        $remarks = isset($validated['remarks']) ? trim((string) $validated['remarks']) : null;
        $leave_request->update([
            'status' => $validated['decision'],
            'decision_remarks' => $remarks !== '' ? $remarks : null,
            'decided_at' => now(),
            'approved_by_employee_id' => $approverEmployeeId,
        ]);

        $leave_request->loadMissing('employee.user');
        $requester = $leave_request->employee?->user;
        if ($requester !== null && $requester->id !== $request->user()?->id) {
            $requester->notify(new RequestDecisionNotification(
                RequestDecisionNotificationPayload::make(
                    'leave_request',
                    $leave_request->id,
                    $leave_request->code,
                    (string) ($leave_request->date ?? $leave_request->created_at?->format('Y-m-d') ?? ''),
                    $validated['decision'],
                    $leave_request->decision_remarks,
                    $leave_request->decided_at,
                    route('leave-requests.show', $leave_request),
                    EmployeePhotoUrl::forPublicDisk($request->user()?->employee),
                )
            ));
        }

        return redirect()->back()->with('success', 'Decision submitted successfully.');
    }

    /**
     * Show the form for editing the specified leave request.
     */
    public function edit(LeaveRequest $leave_request): Response
    {
        $actor = request()->user();
        $this->assertCanModify($actor, $leave_request);
        $this->assertEditableByCurrentUser($actor, $leave_request);
        $leave_request->load(['employee', 'department', 'approvedByEmployee']);
        $canViewActivityLogs = $actor?->hasModuleAbility(PermissionModule::ActivityLogs, ModuleAbility::View) ?? false;

        $employeeSignatureUrl = $this->publicStorageBrowserUrl($leave_request->employee_signature);
        $approvedBySignatureUrl = $this->publicStorageBrowserUrl($leave_request->approved_by_signature);

        return Inertia::render('leave-requests/edit', [
            'leaveRequest' => array_merge($leave_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
            ]),
            'employees' => $this->requestFormEmployees->employeesForForm($actor, [
                'id', 'first_name', 'last_name', 'department_id',
            ])->load('department:id,name'),
            'canChooseEmployee' => $this->requestFormEmployees->canChooseEmployee($actor),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'leaveTypes' => $this->availableLeaveTypeNames(),
            'signaturesUrl' => $this->leaveRequestSignaturesPostUrl($leave_request),
            'submitUrl' => route('leave-requests.submit', $leave_request, false),
            'cancelUrl' => route('leave-requests.destroy', $leave_request, false),
            'decisionUrl' => route('leave-requests.decide', $leave_request, false),
            'canDecide' => $this->approvalScope->canDecide($actor, $leave_request->employee_id, $leave_request->department_id, (string) $leave_request->status),
            'canCancel' => $this->canCancel($actor, $leave_request),
            'canViewActivityLogs' => $canViewActivityLogs,
            'activityLogs' => $canViewActivityLogs ? $this->activityLogsForLeaveRequest($leave_request) : [],
            'emailLogs' => $this->emailLogsForRequest('leave_request', (int) $leave_request->id),
        ]);
    }

    /**
     * Update the specified leave request.
     */
    public function update(UpdateLeaveRequestRequest $request, LeaveRequest $leave_request): RedirectResponse
    {
        $this->assertCanModify($request->user(), $leave_request);
        $this->assertEditableByCurrentUser($request->user(), $leave_request);
        $data = $request->validated();

        $status = $data['status'] ?? $leave_request->status;
        $startDayType = $data['start_day_type'] ?? 'full';
        $endDayType = $data['end_day_type'] ?? 'full';
        $days = $this->computeDays(
            $data['period_from'] ?? null,
            $data['period_to'] ?? null,
            $startDayType,
            $endDayType,
        );

        $leave_request->update([
            'employee_id' => $data['employee_id'],
            'department_id' => $data['department_id'],
            'absence_types' => [$data['absence_type']],
            'absence_other' => $data['absence_other'] ?? null,
            'details' => ! empty($data['details']) ? $data['details'] : null,
            'date' => $data['date'] ?? null,
            'period_from' => $data['period_from'] ?? null,
            'start_day_type' => $startDayType,
            'period_to' => $data['period_to'] ?? null,
            'end_day_type' => $endDayType,
            'days' => $days,
            'remarks' => ! empty($data['remarks']) ? $data['remarks'] : null,
            'status' => $status,
        ]);

        return to_route('leave-requests.show', $leave_request)
            ->with('success', 'Leave request updated successfully.');
    }

    /**
     * Cancel the specified leave request.
     */
    public function destroy(LeaveRequest $leave_request): RedirectResponse
    {
        $actor = request()->user();
        $status = strtolower((string) $leave_request->status);

        if ($status === 'draft') {
            $this->assertCanModify($actor, $leave_request);
            $this->assertEditableByCurrentUser($actor, $leave_request);
        } elseif (in_array($status, ['submitted', 'approved'], true)) {
            if ($actor === null || ! $actor->isAdministrator()) {
                abort(403);
            }
        } else {
            return redirect()->back()->with('error', 'Only draft, submitted, or approved requests can be cancelled.');
        }

        if ($status === 'cancelled') {
            return redirect()->back()->with('success', 'Leave request is already cancelled.');
        }

        $leave_request->update([
            'status' => 'cancelled',
            'decision_remarks' => $leave_request->decision_remarks,
            'decided_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Leave request cancelled successfully.');
    }

    /**
     * Show printable leave request (company logo, company name, report).
     */
    public function print(LeaveRequest $leave_request): Response
    {
        $this->assertCanView(request()->user(), $leave_request);
        $leave_request->load(['employee.companyProfile', 'department', 'approvedByEmployee']);

        $company = $leave_request->employee?->companyProfile ?? CompanyProfile::query()->first();
        $companyLogoUrl = $this->publicStorageBrowserUrl($company?->logo);

        $employeeSignatureUrl = $this->publicStorageBrowserUrl($leave_request->employee_signature);
        $approvedBySignatureUrl = $this->publicStorageBrowserUrl($leave_request->approved_by_signature);
        $approvedByName = '';
        if ($leave_request->approvedByEmployee) {
            $approvedByName = trim($leave_request->approvedByEmployee->first_name.' '.$leave_request->approvedByEmployee->last_name);
        }
        if ($approvedByName === '' && strtolower((string) $leave_request->status) === 'approved') {
            $approvalStatusLog = LeaveRequestActivityLog::query()
                ->where('leave_request_id', $leave_request->id)
                ->where('field_name', 'status')
                ->where('new_value', 'approved')
                ->orderByDesc('created_at')
                ->first(['actor_name']);

            $approvedByName = trim((string) ($approvalStatusLog?->actor_name ?? ''));
        }

        return Inertia::render('leave-requests/print', [
            'leaveRequest' => array_merge($leave_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
                'approved_by_name' => $approvedByName,
            ]),
            'companyLogoUrl' => $companyLogoUrl,
        ]);
    }

    /**
     * Update signatures for the Leave Request (sign in web portal).
     */
    public function updateSignatures(Request $request, LeaveRequest $leave_request): RedirectResponse
    {
        $this->assertCanModify($request->user(), $leave_request);
        if (strtolower((string) $leave_request->status) !== 'draft' && $request->hasFile('employee_signature')) {
            return redirect()->back()->with('error', 'Employee signature cannot be changed after submission.');
        }
        if (strtolower((string) $leave_request->status) !== 'submitted' && $request->hasFile('approved_by_signature')) {
            return redirect()->back()->with('error', 'Manager/HR signature cannot be changed after decision.');
        }
        $imageRule = ['nullable', File::types(['png', 'jpeg', 'jpg', 'gif', 'webp'])->max(2048)];

        $request->validate([
            'employee_signature' => $imageRule,
            'approved_by_signature' => $imageRule,
            'approved_by_employee_id' => ['nullable', 'integer', 'exists:'.Employee::class.',id'],
        ]);

        $updateData = [];

        if ($request->hasFile('employee_signature')) {
            if ($leave_request->employee_signature) {
                Storage::disk('public')->delete($leave_request->employee_signature);
            }
            $path = $request->file('employee_signature')->store(
                "leave-requests/{$leave_request->id}/signatures",
                'public',
            );
            $updateData['employee_signature'] = $path;
        }

        if ($request->hasFile('approved_by_signature')) {
            if ($leave_request->approved_by_signature) {
                Storage::disk('public')->delete($leave_request->approved_by_signature);
            }
            $path = $request->file('approved_by_signature')->store(
                "leave-requests/{$leave_request->id}/signatures",
                'public',
            );
            $updateData['approved_by_signature'] = $path;
        }

        if ($request->filled('approved_by_employee_id')) {
            $updateData['approved_by_employee_id'] = $request->input('approved_by_employee_id');
        }

        if (! empty($updateData)) {
            $leave_request->update($updateData);
        }

        return redirect()->back()->with('success', 'Signatures updated successfully.');
    }

    /**
     * Compute number of days (inclusive) between period_from and period_to.
     */
    private function computeDays(
        ?string $periodFrom,
        ?string $periodTo,
        string $startDayType = 'full',
        string $endDayType = 'full',
    ): ?float {
        if (empty($periodFrom) || empty($periodTo)) {
            return null;
        }

        $from = Carbon::parse($periodFrom);
        $to = Carbon::parse($periodTo);

        if ($from->isSameDay($to)) {
            return $startDayType === 'half' || $endDayType === 'half' ? 0.5 : 1.0;
        }

        $duration = (float) ($from->diffInDays($to) + 1);

        if ($startDayType === 'half') {
            $duration -= 0.5;
        }
        if ($endDayType === 'half') {
            $duration -= 0.5;
        }

        return max($duration, 0.5);
    }

    private function availableLeaveBalanceForEmployee(Employee $employee): float
    {
        $paidLeaveTypeNames = LeaveType::query()
            ->where('leave_category', 'paid')
            ->pluck('name')
            ->filter(static fn ($name): bool => is_string($name) && $name !== '')
            ->values()
            ->all();

        $approvedRequests = LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->get(['absence_types', 'days']);

        $approvedDaysUsed = (float) $approvedRequests->sum(function (LeaveRequest $leaveRequest) use ($paidLeaveTypeNames): float {
            $types = is_array($leaveRequest->absence_types) ? $leaveRequest->absence_types : [];
            $type = (string) ($types[0] ?? '');

            if ($type === '' || ! in_array($type, $paidLeaveTypeNames, true)) {
                return 0.0;
            }

            return (float) ($leaveRequest->days ?? 0);
        });

        $openingBalance = (float) ($employee->leave_opening_balance ?? 0);

        return $openingBalance - $approvedDaysUsed;
    }

    /**
     * @return array<int, string>
     */
    private function availableLeaveTypeNames(): array
    {
        $leaveTypes = LeaveType::query()
            ->orderBy('name')
            ->pluck('name')
            ->filter(static fn ($name): bool => is_string($name) && $name !== '')
            ->values()
            ->all();

        if ($leaveTypes !== []) {
            return $leaveTypes;
        }

        return ['Personal Leave', 'Sick Leave', 'Maternity Leave', 'Emergency Leave', 'Annual Leave', 'Others'];
    }

    private function isPaidLeaveRequest(LeaveRequest $leaveRequest): bool
    {
        $types = is_array($leaveRequest->absence_types) ? $leaveRequest->absence_types : [];
        $type = (string) ($types[0] ?? '');

        if ($type === '') {
            return true;
        }

        $leaveType = LeaveType::query()
            ->where('name', $type)
            ->first(['leave_category']);

        if ($leaveType === null) {
            // Keep conservative behavior for legacy records that do not map.
            return true;
        }

        return $leaveType->leave_category === 'paid';
    }

    /**
     * Host-relative URL for files stored on the public disk so images load under the same
     * origin as the browser (avoids broken URLs when APP_URL differs from the visit URL).
     */
    private function publicStorageBrowserUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        return '/storage/'.str_replace('\\', '/', ltrim($path, '/'));
    }

    /**
     * POST URL for saving leave request signatures (host-relative).
     */
    private function leaveRequestSignaturesPostUrl(LeaveRequest $leave_request): string
    {
        $key = $leave_request->getKey();
        if ($key === null || $key === '') {
            $key = request()->segment(2);
        }

        return '/leave-requests/'.$key.'/signatures';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function activityLogsForLeaveRequest(LeaveRequest $leaveRequest): array
    {
        return $leaveRequest->activityLogs()
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

    private function assertCanView(?User $user, LeaveRequest $leaveRequest): void
    {
        if (! $this->approvalScope->canView($user, $leaveRequest->employee_id, $leaveRequest->department_id)) {
            abort(403);
        }
    }

    private function assertCanModify(?User $user, LeaveRequest $leaveRequest): void
    {
        if (! $this->approvalScope->canModify($user, $leaveRequest->employee_id, $leaveRequest->department_id, (string) $leaveRequest->status)) {
            abort(403);
        }
    }

    private function assertEditableByCurrentUser(?User $user, LeaveRequest $leaveRequest): void
    {
        if ($user === null) {
            abort(403);
        }

        if (strtolower((string) $leaveRequest->status) !== 'draft') {
            abort(403);
        }
    }

    private function canCancel(?User $user, LeaveRequest $leaveRequest): bool
    {
        if ($user === null) {
            return false;
        }

        $status = strtolower((string) $leaveRequest->status);
        if ($status === 'cancelled') {
            return false;
        }

        if ($status === 'draft') {
            return $this->approvalScope->canModify($user, $leaveRequest->employee_id, $leaveRequest->department_id, (string) $leaveRequest->status);
        }

        if (in_array($status, ['submitted', 'approved'], true)) {
            return $user->isAdministrator();
        }

        return false;
    }

    private function canEdit(?User $user, LeaveRequest $leaveRequest): bool
    {
        if ($user === null) {
            return false;
        }

        return strtolower((string) $leaveRequest->status) === 'draft'
            && $this->approvalScope->canModify($user, $leaveRequest->employee_id, $leaveRequest->department_id, (string) $leaveRequest->status);
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
