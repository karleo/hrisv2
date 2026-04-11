<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItAssetRequest\StoreItAssetRequestRequest;
use App\Http\Requests\ItAssetRequest\UpdateItAssetRequestRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\ItAssetRequest;
use App\Models\User;
use App\Notifications\RequestDecisionNotification;
use App\Notifications\RequestSubmittedNotification;
use App\Support\EmployeePhotoUrl;
use App\Support\RequestApprovalScope;
use App\Support\RequestDecisionNotificationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ItAssetRequestController extends Controller
{
    public function __construct(private readonly RequestApprovalScope $approvalScope) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $itAssetRequests = ItAssetRequest::query()
            ->with(['employee', 'department'])
            ->tap(fn ($query) => $this->approvalScope->scopeVisible($query, $request->user()))
            ->when(
                $request->filled('search'),
                fn ($query) => $query->whereHas('employee', function ($q) use ($request): void {
                    $q->where('first_name', 'like', '%'.$request->search.'%')
                        ->orWhere('last_name', 'like', '%'.$request->search.'%');
                })
            )
            ->orderByDesc('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('it-asset-requests/index', [
            'itAssetRequests' => $itAssetRequests,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('it-asset-requests/create', [
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'department_id']),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'hardware' => Hardware::query()
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'defaultEmployeeId' => $request->user()?->employee?->id,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItAssetRequestRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $itAssetRequest = ItAssetRequest::query()->create([
            'employee_id' => $data['employee_id'],
            'department_id' => $data['department_id'],
            'date' => $data['date'],
            'date_issued' => $data['date_issued'] ?? null,
            'hardware_ids' => $data['hardware_ids'] ?? null,
            'serial_number' => $data['serial_number'] ?? null,
            'remarks' => $data['remarks'] ?? null,
            'status' => 'draft',
        ]);

        return to_route('it-asset-requests.show', $itAssetRequest);
    }

    /**
     * Display the specified resource.
     */
    public function show(ItAssetRequest $it_asset_request): Response
    {
        $this->assertCanView(request()->user(), $it_asset_request);
        $it_asset_request->load(['employee', 'department', 'issuedByEmployee']);

        $it_asset_request->employee_signature_url = $it_asset_request->employee_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($it_asset_request->employee_signature, '/'))
            : null;
        $it_asset_request->issued_by_signature_url = $it_asset_request->issued_by_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($it_asset_request->issued_by_signature, '/'))
            : null;

        return Inertia::render('it-asset-requests/show', [
            'itAssetRequest' => $it_asset_request,
            'hardware' => function () use ($it_asset_request): array {
                if (empty($it_asset_request->hardware_ids)) {
                    return [];
                }

                return Hardware::query()
                    ->whereIn('id', $it_asset_request->hardware_ids)
                    ->get(['id', 'code', 'name'])
                    ->toArray();
            },
            'employees' => fn () => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'department_id']),
            'submitUrl' => route('it-asset-requests.submit', $it_asset_request, false),
            'signaturesUrl' => $this->itAssetRequestSignaturesPostUrl($it_asset_request),
            'decisionUrl' => route('it-asset-requests.decide', $it_asset_request, false),
            'canDecide' => $this->approvalScope->canDecide(request()->user(), $it_asset_request->employee_id, $it_asset_request->department_id, (string) $it_asset_request->status),
        ]);
    }

    /**
     * Submit a draft IT asset request.
     */
    public function submit(ItAssetRequest $it_asset_request): RedirectResponse
    {
        $this->assertCanModify(request()->user(), $it_asset_request);
        if (strtolower((string) $it_asset_request->status) !== 'draft') {
            return redirect()->back()->with('error', 'Only draft IT asset requests can be submitted.');
        }

        $it_asset_request->update(['status' => 'submitted']);
        $it_asset_request->loadMissing('employee');
        $this->notifyApprovers(
            request()->user(),
            $it_asset_request->department_id,
            [
                'request_type' => 'it_asset_request',
                'request_id' => $it_asset_request->id,
                'request_code' => $it_asset_request->code,
                'request_date' => (string) (optional($it_asset_request->date)->format('Y-m-d') ?? $it_asset_request->created_at?->format('Y-m-d') ?? ''),
                'submitted_by' => $it_asset_request->employee
                    ? trim($it_asset_request->employee->first_name.' '.$it_asset_request->employee->last_name)
                    : 'Employee',
                'route' => route('it-asset-requests.show', $it_asset_request),
                'employee_photo_url' => EmployeePhotoUrl::forPublicDisk($it_asset_request->employee),
            ]
        );

        return redirect()
            ->route('it-asset-requests.index')
            ->with('success', 'IT asset request submitted.');
    }

    public function decide(Request $request, ItAssetRequest $it_asset_request): RedirectResponse
    {
        if (! $this->approvalScope->canDecide($request->user(), $it_asset_request->employee_id, $it_asset_request->department_id, (string) $it_asset_request->status)) {
            abort(403);
        }

        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'remarks' => ['nullable', 'string', 'max:2000', 'required_if:decision,rejected'],
        ]);

        if ($validated['decision'] === 'approved' && blank($it_asset_request->issued_by_signature)) {
            return redirect()->back()->with('error', 'Please save your issued-by signature before approving this request.');
        }

        $approverEmployeeId = $request->user()?->employee?->id;
        $remarks = isset($validated['remarks']) ? trim((string) $validated['remarks']) : null;
        $it_asset_request->update([
            'status' => $validated['decision'],
            'decision_remarks' => $remarks !== '' ? $remarks : null,
            'decided_at' => now(),
            'issued_by_employee_id' => $approverEmployeeId,
        ]);

        $it_asset_request->loadMissing('employee.user');
        $requester = $it_asset_request->employee?->user;
        if ($requester !== null && $requester->id !== $request->user()?->id) {
            $requester->notify(new RequestDecisionNotification(
                RequestDecisionNotificationPayload::make(
                    'it_asset_request',
                    $it_asset_request->id,
                    $it_asset_request->code,
                    (string) (optional($it_asset_request->date)->format('Y-m-d') ?? $it_asset_request->created_at?->format('Y-m-d') ?? ''),
                    $validated['decision'],
                    $it_asset_request->decision_remarks,
                    $it_asset_request->decided_at,
                    route('it-asset-requests.show', $it_asset_request),
                    EmployeePhotoUrl::forPublicDisk($request->user()?->employee),
                )
            ));
        }

        return redirect()->back()->with('success', 'Decision submitted successfully.');
    }

    /**
     * Show printable IT Asset request.
     */
    public function print(ItAssetRequest $it_asset_request): Response
    {
        $this->assertCanView(request()->user(), $it_asset_request);
        $it_asset_request->load(['employee.companyProfile', 'department', 'issuedByEmployee']);

        $hardware = [];
        if ($it_asset_request->hardware_ids) {
            $hardware = Hardware::query()
                ->whereIn('id', $it_asset_request->hardware_ids)
                ->get(['id', 'code', 'name'])
                ->toArray();
        }

        $company = $it_asset_request->employee?->companyProfile ?? CompanyProfile::query()->first();
        $companyLogoUrl = $this->publicStorageBrowserUrl($company?->logo);

        return Inertia::render('it-asset-requests/print', [
            'itAssetRequest' => array_merge($it_asset_request->toArray(), [
                'employee_signature_url' => $this->publicStorageBrowserUrl($it_asset_request->employee_signature),
                'issued_by_signature_url' => $this->publicStorageBrowserUrl($it_asset_request->issued_by_signature),
            ]),
            'hardware' => $hardware,
            'companyLogoUrl' => $companyLogoUrl,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ItAssetRequest $it_asset_request): Response
    {
        $this->assertCanModify(request()->user(), $it_asset_request);
        $it_asset_request->load(['employee', 'department', 'issuedByEmployee']);

        $it_asset_request->employee_signature_url = $it_asset_request->employee_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($it_asset_request->employee_signature, '/'))
            : null;
        $it_asset_request->issued_by_signature_url = $it_asset_request->issued_by_signature
            ? '/storage/'.str_replace('\\', '/', ltrim($it_asset_request->issued_by_signature, '/'))
            : null;

        return Inertia::render('it-asset-requests/edit', [
            'itAssetRequest' => $it_asset_request,
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'department_id']),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'hardware' => Hardware::query()
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'signaturesUrl' => $this->itAssetRequestSignaturesPostUrl($it_asset_request),
            'canDecide' => $this->approvalScope->canDecide(request()->user(), $it_asset_request->employee_id, $it_asset_request->department_id, (string) $it_asset_request->status),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateItAssetRequestRequest $request, ItAssetRequest $it_asset_request): RedirectResponse
    {
        $this->assertCanModify($request->user(), $it_asset_request);
        $data = $request->validated();

        $status = $data['status'] ?? $it_asset_request->status;

        $it_asset_request->update([
            'employee_id' => $data['employee_id'],
            'department_id' => $data['department_id'],
            'date' => $data['date'],
            'date_issued' => $data['date_issued'] ?? null,
            'hardware_ids' => $data['hardware_ids'] ?? null,
            'serial_number' => $data['serial_number'] ?? null,
            'remarks' => $data['remarks'] ?? null,
            'status' => $status,
        ]);

        return to_route('it-asset-requests.index');
    }

    /**
     * Update signatures for the IT Asset Request.
     */
    public function updateSignatures(Request $request, ItAssetRequest $it_asset_request): RedirectResponse
    {
        $this->assertCanModify($request->user(), $it_asset_request);
        if (strtolower((string) $it_asset_request->status) !== 'draft' && $request->hasFile('employee_signature')) {
            return redirect()->back()->with('error', 'Employee signature cannot be changed after submission.');
        }
        if (strtolower((string) $it_asset_request->status) !== 'submitted' && $request->hasFile('issued_by_signature')) {
            return redirect()->back()->with('error', 'Manager/HR signature cannot be changed after decision.');
        }
        $request->validate([
            'employee_signature' => ['nullable', 'image', 'max:2048'],
            'issued_by_signature' => ['nullable', 'image', 'max:2048'],
            'issued_by_employee_id' => ['nullable', 'integer', 'exists:'.Employee::class.',id'],
        ]);

        $updateData = [];

        if ($request->hasFile('employee_signature')) {
            if ($it_asset_request->employee_signature) {
                Storage::disk('public')->delete($it_asset_request->employee_signature);
            }
            $path = $request->file('employee_signature')->store(
                "it-asset-requests/{$it_asset_request->id}/signatures",
                'public',
            );
            $updateData['employee_signature'] = $path;
        }

        if ($request->hasFile('issued_by_signature')) {
            if ($it_asset_request->issued_by_signature) {
                Storage::disk('public')->delete($it_asset_request->issued_by_signature);
            }
            $path = $request->file('issued_by_signature')->store(
                "it-asset-requests/{$it_asset_request->id}/signatures",
                'public',
            );
            $updateData['issued_by_signature'] = $path;
        }

        if ($request->filled('issued_by_employee_id')) {
            $updateData['issued_by_employee_id'] = $request->input('issued_by_employee_id');
        }

        if (! empty($updateData)) {
            $it_asset_request->update($updateData);
        }

        return redirect()->back()->with('success', 'Signatures updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ItAssetRequest $it_asset_request): RedirectResponse
    {
        $this->assertCanModify(request()->user(), $it_asset_request);
        if ($it_asset_request->employee_signature) {
            Storage::disk('public')->delete($it_asset_request->employee_signature);
        }
        if ($it_asset_request->issued_by_signature) {
            Storage::disk('public')->delete($it_asset_request->issued_by_signature);
        }

        $it_asset_request->delete();

        return to_route('it-asset-requests.index');
    }

    /**
     * POST URL for saving IT asset request signatures (host-relative).
     */
    private function itAssetRequestSignaturesPostUrl(ItAssetRequest $it_asset_request): string
    {
        $key = $it_asset_request->getKey();
        if ($key === null || $key === '') {
            $key = request()->segment(2);
        }

        return '/it-asset-requests/'.$key.'/signatures';
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

    private function assertCanView(?User $user, ItAssetRequest $itAssetRequest): void
    {
        if (! $this->approvalScope->canView($user, $itAssetRequest->employee_id, $itAssetRequest->department_id)) {
            abort(403);
        }
    }

    private function assertCanModify(?User $user, ItAssetRequest $itAssetRequest): void
    {
        if (! $this->approvalScope->canModify($user, $itAssetRequest->employee_id, $itAssetRequest->department_id, (string) $itAssetRequest->status)) {
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
