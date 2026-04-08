<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItRequest\StoreItRequestRequest;
use App\Http\Requests\ItRequest\UpdateItRequestRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\ItRequest;
use App\Models\Software;
use App\Models\User;
use App\Notifications\RequestDecisionNotification;
use App\Notifications\RequestSubmittedNotification;
use App\Support\RequestApprovalScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ItRequestController extends Controller
{
    public function __construct(private readonly RequestApprovalScope $approvalScope)
    {
    }

    /**
     * Display a listing of the IT requests.
     */
    public function index(Request $request): Response
    {
        $itRequests = ItRequest::query()
            ->with(['employee', 'department'])
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
    public function create(): Response
    {
        return Inertia::render('it-requests/create', [
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'department_id']),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'software' => Software::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'hardware' => Hardware::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
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
        $this->assertCanView(request()->user(), $it_request);
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
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
            'signaturesUrl' => $this->itRequestSignaturesPostUrl($it_request),
            'submitUrl' => route('it-requests.submit', $it_request, false),
            'decisionUrl' => route('it-requests.decide', $it_request, false),
            'canDecide' => $this->approvalScope->canDecide(request()->user(), $it_request->employee_id, $it_request->department_id, (string) $it_request->status),
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
            $requester->notify(new RequestDecisionNotification([
                'request_type' => 'it_request',
                'request_id' => $it_request->id,
                'request_code' => (string) $it_request->id,
                'request_date' => (string) (optional($it_request->date)->format('Y-m-d') ?? $it_request->created_at?->format('Y-m-d') ?? ''),
                'decision' => $validated['decision'],
                'remarks' => $it_request->decision_remarks,
                'decided_at' => optional($it_request->decided_at)?->toDateTimeString(),
                'route' => route('it-requests.show', $it_request),
            ]));
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
        $this->assertCanModify(request()->user(), $it_request);
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
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'department_id']),
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
        ]);
    }

    /**
     * Update the specified IT request.
     */
    public function update(UpdateItRequestRequest $request, ItRequest $it_request): RedirectResponse
    {
        $this->assertCanModify($request->user(), $it_request);
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
     * Remove the specified IT request.
     */
    public function destroy(ItRequest $it_request): RedirectResponse
    {
        $this->assertCanModify(request()->user(), $it_request);
        if ($it_request->employee_signature) {
            Storage::disk('public')->delete($it_request->employee_signature);
        }
        if ($it_request->approved_by_signature) {
            Storage::disk('public')->delete($it_request->approved_by_signature);
        }

        $it_request->delete();

        return to_route('it-requests.index');
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
