<?php

namespace App\Http\Controllers;

use App\Http\Requests\LeaveRequest\StoreLeaveRequestRequest;
use App\Http\Requests\LeaveRequest\UpdateLeaveRequestRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Notifications\RequestDecisionNotification;
use App\Notifications\RequestSubmittedNotification;
use App\Support\EmployeePhotoUrl;
use App\Support\RequestApprovalScope;
use App\Support\RequestDecisionNotificationPayload;
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
    public function __construct(private readonly RequestApprovalScope $approvalScope) {}

    /**
     * Display a listing of the leave requests.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'department_id' => ['sometimes', 'nullable', 'integer', 'exists:departments,id'],
            'status' => ['sometimes', 'nullable', 'string', 'max:50'],
            'date_preset' => ['sometimes', 'nullable', 'string', Rule::in(['today', 'yesterday', 'last_7_days', 'this_month'])],
        ]);

        $departmentId = $validated['department_id'] ?? null;
        $statusFilter = isset($validated['status']) && $validated['status'] !== ''
            ? $validated['status']
            : null;
        $datePreset = isset($validated['date_preset']) && $validated['date_preset'] !== ''
            ? $validated['date_preset']
            : null;

        $applyFilters = function ($query) use ($request, $departmentId, $statusFilter, $datePreset): void {
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
            ->with(['employee', 'department'])
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
        return Inertia::render('leave-requests/create', [
            'employees' => Employee::query()
                ->with('department:id,name')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'department_id']),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'defaultEmployeeId' => $request->user()?->employee?->id,
        ]);
    }

    /**
     * Store a newly created leave request.
     */
    public function store(StoreLeaveRequestRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $days = $this->computeDays(
            $data['period_from'] ?? null,
            $data['period_to'] ?? null
        );

        $leaveRequest = LeaveRequest::query()->create([
            'employee_id' => $data['employee_id'],
            'department_id' => $data['department_id'],
            'absence_types' => [$data['absence_type']],
            'absence_other' => $data['absence_other'] ?? null,
            'details' => ! empty($data['details']) ? $data['details'] : null,
            'date' => $data['date'] ?? null,
            'period_from' => $data['period_from'] ?? null,
            'period_to' => $data['period_to'] ?? null,
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
        $this->assertCanView(request()->user(), $leave_request);
        $leave_request->load(['employee', 'department', 'approvedByEmployee']);

        $employeeSignatureUrl = $this->publicStorageBrowserUrl($leave_request->employee_signature);
        $approvedBySignatureUrl = $this->publicStorageBrowserUrl($leave_request->approved_by_signature);

        return Inertia::render('leave-requests/show', [
            'leaveRequest' => array_merge($leave_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
            ]),
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
            'signaturesUrl' => $this->leaveRequestSignaturesPostUrl($leave_request),
            'submitUrl' => route('leave-requests.submit', $leave_request, false),
            'decisionUrl' => route('leave-requests.decide', $leave_request, false),
            'canDecide' => $this->approvalScope->canDecide(request()->user(), $leave_request->employee_id, $leave_request->department_id, (string) $leave_request->status),
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
        $this->assertCanModify(request()->user(), $leave_request);
        $this->assertEditableByCurrentUser(request()->user(), $leave_request);
        $leave_request->load(['employee', 'department', 'approvedByEmployee']);

        $employeeSignatureUrl = $this->publicStorageBrowserUrl($leave_request->employee_signature);
        $approvedBySignatureUrl = $this->publicStorageBrowserUrl($leave_request->approved_by_signature);

        return Inertia::render('leave-requests/edit', [
            'leaveRequest' => array_merge($leave_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
            ]),
            'employees' => Employee::query()
                ->with('department:id,name')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'department_id']),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'signaturesUrl' => $this->leaveRequestSignaturesPostUrl($leave_request),
            'submitUrl' => route('leave-requests.submit', $leave_request, false),
            'canDecide' => $this->approvalScope->canDecide(request()->user(), $leave_request->employee_id, $leave_request->department_id, (string) $leave_request->status),
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
        $days = $this->computeDays(
            $data['period_from'] ?? null,
            $data['period_to'] ?? null
        );

        $leave_request->update([
            'employee_id' => $data['employee_id'],
            'department_id' => $data['department_id'],
            'absence_types' => [$data['absence_type']],
            'absence_other' => $data['absence_other'] ?? null,
            'details' => ! empty($data['details']) ? $data['details'] : null,
            'date' => $data['date'] ?? null,
            'period_from' => $data['period_from'] ?? null,
            'period_to' => $data['period_to'] ?? null,
            'days' => $days,
            'remarks' => ! empty($data['remarks']) ? $data['remarks'] : null,
            'status' => $status,
        ]);

        return to_route('leave-requests.index');
    }

    /**
     * Remove the specified leave request.
     */
    public function destroy(LeaveRequest $leave_request): RedirectResponse
    {
        $this->assertCanModify(request()->user(), $leave_request);
        $this->assertEditableByCurrentUser(request()->user(), $leave_request);
        if ($leave_request->employee_signature) {
            Storage::disk('public')->delete($leave_request->employee_signature);
        }
        if ($leave_request->approved_by_signature) {
            Storage::disk('public')->delete($leave_request->approved_by_signature);
        }

        $leave_request->delete();

        return to_route('leave-requests.index');
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
    private function computeDays(?string $periodFrom, ?string $periodTo): ?int
    {
        if (empty($periodFrom) || empty($periodTo)) {
            return null;
        }

        $from = Carbon::parse($periodFrom);
        $to = Carbon::parse($periodTo);

        return $from->diffInDays($to) + 1;
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
        // HR/Admin can still perform corrections when needed.
        if ($user !== null && $this->approvalScope->isAdministratorOrHr($user)) {
            return;
        }

        if (strtolower((string) $leaveRequest->status) !== 'draft') {
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
