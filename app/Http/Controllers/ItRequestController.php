<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItRequest\StoreItRequestRequest;
use App\Http\Requests\ItRequest\UpdateItRequestRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\ItRequest;
use App\Models\RequestEmailLog;
use App\Models\Software;
use App\Models\User;
use App\Notifications\RequestDecisionNotification;
use App\Notifications\RequestSubmittedNotification;
use App\Support\CompanyAccessScope;
use App\Support\EmployeePhotoUrl;
use App\Support\RequestApprovalScope;
use App\Support\RequestDecisionNotificationPayload;
use App\Support\RequestFormEmployeeSelection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ItRequestController extends Controller
{
    public function __construct(
        private readonly RequestApprovalScope $approvalScope,
        private readonly CompanyAccessScope $companyScope,
        private readonly RequestFormEmployeeSelection $requestFormEmployees,
    ) {}

    /**
     * Display a listing of the IT requests.
     */
    public function index(Request $request): Response
    {
        $itRequests = ItRequest::query()
            ->with(['employee.companyProfile:id,company_name', 'department'])
            ->tap(fn ($query) => $this->approvalScope->scopeVisible($query, $request->user()))
            ->when(
                $request->filled('search'),
                fn ($query) => $query->whereHas('employee', function ($q) use ($request): void {
                    $q->where('first_name', 'like', '%'.$request->search.'%')
                        ->orWhere('last_name', 'like', '%'.$request->search.'%');
                })
            )
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('it-requests/index', [
            'itRequests' => $itRequests,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new IT request.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('it-requests/create', [
            'employees' => $this->requestFormEmployees->employeesForForm($user, [
                'id', 'first_name', 'last_name', 'department_id',
            ]),
            'canChooseEmployee' => $this->requestFormEmployees->canChooseEmployee($user),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'software' => Software::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'hardware' => Hardware::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'defaultEmployeeId' => $user?->loadMissing('employee')->employee?->id,
        ]);
    }

    /**
     * Store a newly created IT request.
     */
    public function store(StoreItRequestRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $date = $data['date'] ?? now()->toDateString();

        $itRequest = ItRequest::query()->create([
            'employee_id' => $data['employee_id'],
            'department_id' => $data['department_id'],
            'software_id' => $data['software_id'] ?? null,
            'hardware_id' => $data['hardware_id'] ?? null,
            'status' => 'draft',
            'date' => $date,
        ]);

        return to_route('it-requests.show', $itRequest);
    }

    /**
     * Display the specified IT request.
     */
    public function show(ItRequest $it_request): Response
    {
        $actor = request()->user();
        $this->assertCanView($actor, $it_request);
        $it_request->load(['employee', 'department', 'software', 'hardware', 'approvedByEmployee']);

        $employeeSignatureUrl = $it_request->employee_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($it_request->employee_signature, '/'))
            : null;
        $approvedBySignatureUrl = $it_request->approved_by_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($it_request->approved_by_signature, '/'))
            : null;

        return Inertia::render('it-requests/show', [
            'itRequest' => array_merge($it_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
            ]),
            'employees' => $this->companyScope->scopedEmployeeQuery($request->user())
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
            'signaturesUrl' => $this->itRequestSignaturesPostUrl($it_request),
            'submitUrl' => route('it-requests.submit', $it_request, false),
            'cancelUrl' => route('it-requests.destroy', $it_request, false),
            'decisionUrl' => route('it-requests.decide', $it_request, false),
            'canDecide' => $this->approvalScope->canDecide($actor, $it_request->employee_id, $it_request->department_id, (string) $it_request->status),
            'canCancel' => $this->canCancel($actor, $it_request),
            'canEdit' => $this->canEdit($actor, $it_request),
            'emailLogs' => $this->emailLogsForRequest('it_request', (int) $it_request->id),
        ]);
    }

    /**
     * Submit a draft IT request.
     */
    public function submit(ItRequest $it_request): RedirectResponse
    {
        $this->assertCanModify(request()->user(), $it_request);
        if (strtolower((string) $it_request->status) !== 'draft') {
            return redirect()->back()->with('error', 'Only draft IT requests can be submitted.');
        }

        $it_request->update(['status' => 'submitted']);
        $it_request->loadMissing('employee');
        $this->notifyApprovers(
            request()->user(),
            $it_request->department_id,
            [
                'request_type' => 'it_request',
                'request_id' => $it_request->id,
                'request_code' => (string) ($it_request->id),
                'request_date' => (string) (optional($it_request->date)->format('Y-m-d') ?? $it_request->created_at?->format('Y-m-d') ?? ''),
                'submitted_by' => $it_request->employee
                    ? trim($it_request->employee->first_name.' '.$it_request->employee->last_name)
                    : 'Employee',
                'route' => route('it-requests.show', $it_request),
                'employee_photo_url' => EmployeePhotoUrl::forPublicDisk($it_request->employee),
            ]
        );

        return redirect()
            ->route('it-requests.index')
            ->with('success', 'IT request submitted.');
    }

    public function decide(Request $request, ItRequest $it_request): RedirectResponse
    {
        if (! $this->approvalScope->canDecide($request->user(), $it_request->employee_id, $it_request->department_id, (string) $it_request->status)) {
            abort(403);
        }

        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'remarks' => ['nullable', 'string', 'max:2000', 'required_if:decision,rejected'],
        ]);

        if ($validated['decision'] === 'approved' && blank($it_request->approved_by_signature)) {
            return redirect()->back()->with('error', 'Please save your manager or HR signature before approving this request.');
        }

        $approverEmployeeId = $request->user()?->employee?->id;
        $remarks = isset($validated['remarks']) ? trim((string) $validated['remarks']) : null;
        $it_request->update([
            'status' => $validated['decision'],
            'decision_remarks' => $remarks !== '' ? $remarks : null,
            'decided_at' => now(),
            'approved_by_employee_id' => $approverEmployeeId,
        ]);

        $it_request->loadMissing('employee.user');
        $requester = $it_request->employee?->user;
        if ($requester !== null && $requester->id !== $request->user()?->id) {
            $requester->notify(new RequestDecisionNotification(
                RequestDecisionNotificationPayload::make(
                    'it_request',
                    $it_request->id,
                    (string) $it_request->id,
                    (string) (optional($it_request->date)->format('Y-m-d') ?? $it_request->created_at?->format('Y-m-d') ?? ''),
                    $validated['decision'],
                    $it_request->decision_remarks,
                    $it_request->decided_at,
                    route('it-requests.show', $it_request),
                    EmployeePhotoUrl::forPublicDisk($request->user()?->employee),
                )
            ));
        }

        return redirect()->back()->with('success', 'Decision submitted successfully.');
    }

    /**
     * Show printable IT request.
     */
    public function print(ItRequest $it_request): Response
    {
        $this->assertCanView(request()->user(), $it_request);
        $it_request->load(['employee.companyProfile', 'department', 'software', 'hardware', 'approvedByEmployee']);

        $company = $it_request->employee?->companyProfile ?? CompanyProfile::query()->first();
        $companyLogoUrl = $this->publicStorageBrowserUrl($company?->logo);

        $employeeSignatureUrl = $this->publicStorageBrowserUrl($it_request->employee_signature);
        $approvedBySignatureUrl = $this->publicStorageBrowserUrl($it_request->approved_by_signature);
        $approvedByName = '';
        if ($it_request->approvedByEmployee) {
            $approvedByName = trim($it_request->approvedByEmployee->first_name.' '.$it_request->approvedByEmployee->last_name);
        }

        return Inertia::render('it-requests/print', [
            'itRequest' => array_merge($it_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
                'approved_by_name' => $approvedByName,
            ]),
            'companyLogoUrl' => $companyLogoUrl,
        ]);
    }

    /**
     * Show the form for editing the specified IT request.
     */
    public function edit(ItRequest $it_request): Response
    {
        $actor = request()->user();
        $this->assertCanModify($actor, $it_request);
        $this->assertEditableStatus($it_request);
        $it_request->load(['employee', 'department', 'software', 'hardware', 'approvedByEmployee']);

        $employeeSignatureUrl = $it_request->employee_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($it_request->employee_signature, '/'))
            : null;
        $approvedBySignatureUrl = $it_request->approved_by_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($it_request->approved_by_signature, '/'))
            : null;

        return Inertia::render('it-requests/edit', [
            'itRequest' => array_merge($it_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
            ]),
            'employees' => $this->requestFormEmployees->employeesForForm($actor, [
                'id', 'first_name', 'last_name', 'department_id',
            ]),
            'canChooseEmployee' => $this->requestFormEmployees->canChooseEmployee($actor),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'software' => Software::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'hardware' => Hardware::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'signaturesUrl' => $this->itRequestSignaturesPostUrl($it_request),
            'cancelUrl' => route('it-requests.destroy', $it_request, false),
            'canDecide' => $this->approvalScope->canDecide($actor, $it_request->employee_id, $it_request->department_id, (string) $it_request->status),
            'canCancel' => $this->canCancel($actor, $it_request),
        ]);
    }

    /**
     * Update the specified IT request.
     */
    public function update(UpdateItRequestRequest $request, ItRequest $it_request): RedirectResponse
    {
        $this->assertCanModify($request->user(), $it_request);
        $this->assertEditableStatus($it_request);
        $data = $request->validated();

        $status = $data['status'] ?? $it_request->status;
        $date = $data['date'] ?? $it_request->date?->format('Y-m-d') ?? now()->toDateString();

        $it_request->update([
            'employee_id' => $data['employee_id'],
            'department_id' => $data['department_id'],
            'software_id' => $data['software_id'] ?? null,
            'hardware_id' => $data['hardware_id'] ?? null,
            'status' => $status,
            'date' => $date,
        ]);

        return to_route('it-requests.index');
    }

    /**
     * Cancel the specified IT request.
     */
    public function destroy(ItRequest $it_request): RedirectResponse
    {
        $actor = request()->user();
        $status = strtolower((string) $it_request->status);

        if ($status === 'draft') {
            $this->assertCanModify($actor, $it_request);
        } elseif (in_array($status, ['submitted', 'approved'], true)) {
            if ($actor === null || ! $actor->isAdministrator()) {
                abort(403);
            }
        } else {
            return redirect()->back()->with('error', 'Only draft, submitted, or approved requests can be cancelled.');
        }

        if ($status === 'cancelled') {
            return redirect()->back()->with('success', 'IT request is already cancelled.');
        }

        $it_request->update([
            'status' => 'cancelled',
            'decided_at' => now(),
        ]);

        return redirect()->back()->with('success', 'IT request cancelled successfully.');
    }

    /**
     * Update signatures for the IT request.
     */
    public function updateSignatures(Request $request, ItRequest $it_request): RedirectResponse
    {
        $this->assertCanModify($request->user(), $it_request);
        if (strtolower((string) $it_request->status) !== 'draft' && $request->hasFile('employee_signature')) {
            return redirect()->back()->with('error', 'Employee signature cannot be changed after submission.');
        }
        if (strtolower((string) $it_request->status) !== 'submitted' && $request->hasFile('approved_by_signature')) {
            return redirect()->back()->with('error', 'Manager/HR signature cannot be changed after decision.');
        }
        $request->validate([
            'employee_signature' => ['nullable', 'image', 'max:2048'],
            'approved_by_signature' => ['nullable', 'image', 'max:2048'],
            'approved_by_employee_id' => ['nullable', 'integer', 'exists:'.Employee::class.',id'],
        ]);

        $updateData = [];

        if ($request->hasFile('employee_signature')) {
            if ($it_request->employee_signature) {
                Storage::disk('public')->delete($it_request->employee_signature);
            }
            $path = $request->file('employee_signature')->store(
                "it-requests/{$it_request->id}/signatures",
                'public',
            );
            $updateData['employee_signature'] = $path;
        }

        if ($request->hasFile('approved_by_signature')) {
            if ($it_request->approved_by_signature) {
                Storage::disk('public')->delete($it_request->approved_by_signature);
            }
            $path = $request->file('approved_by_signature')->store(
                "it-requests/{$it_request->id}/signatures",
                'public',
            );
            $updateData['approved_by_signature'] = $path;
        }

        if ($request->filled('approved_by_employee_id')) {
            $updateData['approved_by_employee_id'] = $request->input('approved_by_employee_id');
        }

        if (! empty($updateData)) {
            $it_request->update($updateData);
        }

        return redirect()->back()->with('success', 'Signatures updated successfully.');
    }

    /**
     * POST URL for saving IT request signatures (host-relative).
     */
    private function itRequestSignaturesPostUrl(ItRequest $it_request): string
    {
        $key = $it_request->getKey();
        if ($key === null || $key === '') {
            $key = request()->segment(2);
        }

        return '/it-requests/'.$key.'/signatures';
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

    private function assertCanView(?User $user, ItRequest $itRequest): void
    {
        if (! $this->approvalScope->canView($user, $itRequest->employee_id, $itRequest->department_id)) {
            abort(403);
        }
    }

    private function assertCanModify(?User $user, ItRequest $itRequest): void
    {
        if (! $this->approvalScope->canModify($user, $itRequest->employee_id, $itRequest->department_id, (string) $itRequest->status)) {
            abort(403);
        }
    }

    private function canCancel(?User $user, ItRequest $itRequest): bool
    {
        if ($user === null) {
            return false;
        }

        $status = strtolower((string) $itRequest->status);
        if ($status === 'cancelled') {
            return false;
        }

        if ($status === 'draft') {
            return $this->approvalScope->canModify($user, $itRequest->employee_id, $itRequest->department_id, (string) $itRequest->status);
        }

        if (in_array($status, ['submitted', 'approved'], true)) {
            return $user->isAdministrator();
        }

        return false;
    }

    private function canEdit(?User $user, ItRequest $itRequest): bool
    {
        if ($user === null) {
            return false;
        }

        return strtolower((string) $itRequest->status) === 'draft'
            && $this->approvalScope->canModify($user, $itRequest->employee_id, $itRequest->department_id, (string) $itRequest->status);
    }

    private function assertEditableStatus(ItRequest $itRequest): void
    {
        if (strtolower((string) $itRequest->status) !== 'draft') {
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
}
