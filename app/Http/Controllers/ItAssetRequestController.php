<?php

namespace App\Http\Controllers;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Http\Requests\ItAssetRequest\StoreItAssetRequestRequest;
use App\Http\Requests\ItAssetRequest\UpdateItAssetRequestRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\ItAssetRequest;
use App\Models\RequestEmailLog;
use App\Models\User;
use App\Notifications\RequestDecisionNotification;
use App\Notifications\RequestSubmittedNotification;
use App\Support\CompanyAccessScope;
use App\Support\EmployeePhotoUrl;
use App\Support\ItAssetValuation;
use App\Support\PublicStorageUrl;
use App\Support\RequestApprovalScope;
use App\Support\RequestDecisionNotificationPayload;
use App\Support\RequestFormEmployeeSelection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ItAssetRequestController extends Controller
{
    public function __construct(
        private readonly RequestApprovalScope $approvalScope,
        private readonly ItAssetValuation $valuation,
        private readonly CompanyAccessScope $companyScope,
        private readonly RequestFormEmployeeSelection $requestFormEmployees,
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $itAssetRequests = ItAssetRequest::query()
            ->with(['employee.companyProfile:id,company_name', 'department'])
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
        $canViewActivityLogs = $request->user()?->hasModuleAbility(PermissionModule::ActivityLogs, ModuleAbility::View) ?? false;

        $user = $request->user();

        return Inertia::render('it-asset-requests/create', [
            'employees' => $this->requestFormEmployees->employeesForForm($user, [
                'id', 'first_name', 'last_name', 'department_id',
            ]),
            'canChooseEmployee' => $this->requestFormEmployees->canChooseEmployee($user),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'hardware' => $this->valuation->assetOptions(),
            'defaultEmployeeId' => $user?->loadMissing('employee')->employee?->id,
            'canViewActivityLogs' => $canViewActivityLogs,
            'activityLogs' => [],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItAssetRequestRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $hardwareItems = $this->normalizeHardwareItemsInput($data);
        $hardwareItems = $this->valuation->withSnapshots($hardwareItems);
        $hardwareIds = array_values(array_unique(array_map(fn (array $item): int => $item['hardware_id'], $hardwareItems)));
        $legacySerialNumber = $this->deriveLegacySerialNumber($hardwareItems, $data['serial_number'] ?? null);

        $itAssetRequest = DB::transaction(function () use ($data, $hardwareItems, $hardwareIds, $legacySerialNumber): ItAssetRequest {
            $itAssetRequest = ItAssetRequest::query()->create([
                'employee_id' => $data['employee_id'],
                'department_id' => $data['department_id'],
                'date' => $data['date'],
                'date_issued' => $data['date_issued'] ?? null,
                'hardware_ids' => $hardwareIds !== [] ? $hardwareIds : null,
                'serial_number' => $legacySerialNumber,
                'remarks' => $data['remarks'] ?? null,
                'status' => 'draft',
            ]);

            if ($hardwareItems !== []) {
                $itAssetRequest->hardwareItems()->createMany($hardwareItems);
            }

            return $itAssetRequest;
        });

        $signaturePath = $this->storeSignatureFromDataUrl(
            $data['employee_signature_data_url'] ?? null,
            "it-asset-requests/{$itAssetRequest->id}/signatures",
        );
        if ($signaturePath !== null) {
            $itAssetRequest->update(['employee_signature' => $signaturePath]);
        }

        return to_route('it-asset-requests.show', $itAssetRequest);
    }

    /**
     * Display the specified resource.
     */
    public function show(ItAssetRequest $it_asset_request): Response
    {
        $actor = request()->user();
        $this->assertCanView($actor, $it_asset_request);
        $it_asset_request->load(['employee', 'department', 'issuedByEmployee', 'hardwareItems.hardware', 'hardwareItems.hardwareAssetValue']);
        $canViewActivityLogs = $actor?->hasModuleAbility(PermissionModule::ActivityLogs, ModuleAbility::View) ?? false;
        $hardwareItems = $this->valuation->resolvedHardwareItemsForDisplay($it_asset_request);

        $it_asset_request->employee_signature_url = $it_asset_request->employee_signature
            ? PublicStorageUrl::forPath($it_asset_request->employee_signature)
            : null;
        $it_asset_request->issued_by_signature_url = $it_asset_request->issued_by_signature
            ? PublicStorageUrl::forPath($it_asset_request->issued_by_signature)
            : null;
        $it_asset_request->hardware_items = $hardwareItems;

        return Inertia::render('it-asset-requests/show', [
            'itAssetRequest' => $it_asset_request,
            'hardware' => array_map(fn (array $item): array => $item['hardware'], $hardwareItems),
            'hardwareItems' => $hardwareItems,
            'assetTotals' => $this->valuation->totalsForHardwareItems($hardwareItems),
            'employees' => fn () => $this->requestFormEmployees->employeesForForm($actor, [
                'id', 'first_name', 'last_name', 'department_id',
            ]),
            'canChooseEmployee' => $this->requestFormEmployees->canChooseEmployee($actor),
            'submitUrl' => route('it-asset-requests.submit', $it_asset_request, false),
            'cancelUrl' => route('it-asset-requests.destroy', $it_asset_request, false),
            'signaturesUrl' => $this->itAssetRequestSignaturesPostUrl($it_asset_request),
            'decisionUrl' => route('it-asset-requests.decide', $it_asset_request, false),
            'canDecide' => $this->approvalScope->canDecide($actor, $it_asset_request->employee_id, $it_asset_request->department_id, (string) $it_asset_request->status),
            'canCancel' => $this->canCancel($actor, $it_asset_request),
            'canEdit' => $this->canEdit($actor, $it_asset_request),
            'canViewActivityLogs' => $canViewActivityLogs,
            'activityLogs' => $canViewActivityLogs ? $this->activityLogsForItAssetRequest($it_asset_request) : [],
            'emailLogs' => $this->emailLogsForRequest('it_asset_request', (int) $it_asset_request->id),
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

        if ($validated['decision'] === 'approved' && blank($it_asset_request->issued_by_employee_id)) {
            return redirect()->back()->with('error', 'Please select the issued-by employee before approving this request.');
        }

        $remarks = isset($validated['remarks']) ? trim((string) $validated['remarks']) : null;
        $decidedAt = now();
        if ($validated['decision'] === 'approved') {
            $this->valuation->fillMissingSnapshots($it_asset_request);
        }

        $it_asset_request->update([
            'status' => $validated['decision'],
            'decision_remarks' => $remarks !== '' ? $remarks : null,
            'decided_at' => $decidedAt,
            'date_issued' => $validated['decision'] === 'approved' ? $decidedAt->toDateString() : $it_asset_request->date_issued,
            'issued_by_employee_id' => $it_asset_request->issued_by_employee_id,
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
        $it_asset_request->load(['employee.companyProfile', 'department', 'issuedByEmployee', 'hardwareItems.hardware', 'hardwareItems.hardwareAssetValue']);
        $hardwareItems = $this->valuation->resolvedHardwareItemsForDisplay($it_asset_request);
        $hardware = array_map(fn (array $item): array => $item['hardware'], $hardwareItems);

        $company = $it_asset_request->employee?->companyProfile ?? CompanyProfile::query()->first();
        $companyLogoUrl = $this->publicStorageBrowserUrl($company?->logo);

        return Inertia::render('it-asset-requests/print', [
            'itAssetRequest' => array_merge($it_asset_request->toArray(), [
                'employee_signature_url' => $this->publicStorageBrowserUrl($it_asset_request->employee_signature),
                'issued_by_signature_url' => $this->publicStorageBrowserUrl($it_asset_request->issued_by_signature),
                'hardware_items' => $hardwareItems,
            ]),
            'hardware' => $hardware,
            'hardwareItems' => $hardwareItems,
            'assetTotals' => $this->valuation->totalsForHardwareItems($hardwareItems),
            'companyLogoUrl' => $companyLogoUrl,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ItAssetRequest $it_asset_request): Response
    {
        $actor = request()->user();
        $this->assertCanModify($actor, $it_asset_request);
        $this->assertEditableStatus($it_asset_request);
        $it_asset_request->load(['employee', 'department', 'issuedByEmployee', 'hardwareItems.hardware', 'hardwareItems.hardwareAssetValue']);
        $canViewActivityLogs = $actor?->hasModuleAbility(PermissionModule::ActivityLogs, ModuleAbility::View) ?? false;
        $hardwareItems = $this->valuation->resolvedHardwareItemsForDisplay($it_asset_request);

        $it_asset_request->employee_signature_url = $it_asset_request->employee_signature
            ? PublicStorageUrl::forPath($it_asset_request->employee_signature)
            : null;
        $it_asset_request->issued_by_signature_url = $it_asset_request->issued_by_signature
            ? PublicStorageUrl::forPath($it_asset_request->issued_by_signature)
            : null;
        $it_asset_request->hardware_items = $hardwareItems;

        return Inertia::render('it-asset-requests/edit', [
            'itAssetRequest' => $it_asset_request,
            'employees' => $this->requestFormEmployees->employeesForForm($actor, [
                'id', 'first_name', 'last_name', 'department_id',
            ]),
            'canChooseEmployee' => $this->requestFormEmployees->canChooseEmployee($actor),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'hardware' => $this->valuation->assetOptions(),
            'hardwareItems' => $hardwareItems,
            'assetTotals' => $this->valuation->totalsForHardwareItems($hardwareItems),
            'signaturesUrl' => $this->itAssetRequestSignaturesPostUrl($it_asset_request),
            'cancelUrl' => route('it-asset-requests.destroy', $it_asset_request, false),
            'canDecide' => $this->approvalScope->canDecide($actor, $it_asset_request->employee_id, $it_asset_request->department_id, (string) $it_asset_request->status),
            'canCancel' => $this->canCancel($actor, $it_asset_request),
            'canViewActivityLogs' => $canViewActivityLogs,
            'activityLogs' => $canViewActivityLogs ? $this->activityLogsForItAssetRequest($it_asset_request) : [],
            'emailLogs' => $this->emailLogsForRequest('it_asset_request', (int) $it_asset_request->id),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateItAssetRequestRequest $request, ItAssetRequest $it_asset_request): RedirectResponse
    {
        $this->assertCanModify($request->user(), $it_asset_request);
        $this->assertEditableStatus($it_asset_request);
        $data = $request->validated();
        $hardwareItems = $this->normalizeHardwareItemsInput($data);
        $hardwareItems = $this->valuation->withSnapshots($hardwareItems);
        $hardwareIds = array_values(array_unique(array_map(fn (array $item): int => $item['hardware_id'], $hardwareItems)));
        $legacySerialNumber = $this->deriveLegacySerialNumber($hardwareItems, $data['serial_number'] ?? null);
        $status = $data['status'] ?? $it_asset_request->status;

        DB::transaction(function () use ($it_asset_request, $data, $status, $hardwareItems, $hardwareIds, $legacySerialNumber): void {
            $it_asset_request->update([
                'employee_id' => $data['employee_id'],
                'department_id' => $data['department_id'],
                'date' => $data['date'],
                'date_issued' => $data['date_issued'] ?? null,
                'hardware_ids' => $hardwareIds !== [] ? $hardwareIds : null,
                'serial_number' => $legacySerialNumber,
                'remarks' => $data['remarks'] ?? null,
                'status' => $status,
            ]);

            $it_asset_request->hardwareItems()->delete();
            if ($hardwareItems !== []) {
                $it_asset_request->hardwareItems()->createMany($hardwareItems);
            }
        });

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
     * Cancel the specified IT asset request.
     */
    public function destroy(ItAssetRequest $it_asset_request): RedirectResponse
    {
        $actor = request()->user();
        $status = strtolower((string) $it_asset_request->status);

        if ($status === 'draft') {
            $this->assertCanModify($actor, $it_asset_request);
        } elseif (in_array($status, ['submitted', 'approved'], true)) {
            if ($actor === null || ! $actor->isAdministrator()) {
                abort(403);
            }
        } else {
            return redirect()->back()->with('error', 'Only draft, submitted, or approved requests can be cancelled.');
        }

        if ($status === 'cancelled') {
            return redirect()->back()->with('success', 'IT asset request is already cancelled.');
        }

        $it_asset_request->update([
            'status' => 'cancelled',
            'decided_at' => now(),
        ]);

        return redirect()->back()->with('success', 'IT asset request cancelled successfully.');
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

        return PublicStorageUrl::forPath($path);
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

    private function canCancel(?User $user, ItAssetRequest $itAssetRequest): bool
    {
        if ($user === null) {
            return false;
        }

        $status = strtolower((string) $itAssetRequest->status);
        if ($status === 'cancelled') {
            return false;
        }

        if ($status === 'draft') {
            return $this->approvalScope->canModify($user, $itAssetRequest->employee_id, $itAssetRequest->department_id, (string) $itAssetRequest->status);
        }

        if (in_array($status, ['submitted', 'approved'], true)) {
            return $user->isAdministrator();
        }

        return false;
    }

    private function canEdit(?User $user, ItAssetRequest $itAssetRequest): bool
    {
        if ($user === null) {
            return false;
        }

        return strtolower((string) $itAssetRequest->status) === 'draft'
            && $this->approvalScope->canModify($user, $itAssetRequest->employee_id, $itAssetRequest->department_id, (string) $itAssetRequest->status);
    }

    private function assertEditableStatus(ItAssetRequest $itAssetRequest): void
    {
        if (strtolower((string) $itAssetRequest->status) !== 'draft') {
            abort(403);
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function activityLogsForItAssetRequest(ItAssetRequest $itAssetRequest): array
    {
        return $itAssetRequest->activityLogs()
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

    /**
     * @param  array<string, mixed>  $data
     * @return array<int, array{hardware_asset_value_id: int|null, hardware_id: int, serial_number: string|null}>
     */
    private function normalizeHardwareItemsInput(array $data): array
    {
        $items = [];

        $incomingItems = $data['hardware_items'] ?? [];
        if (is_array($incomingItems) && $incomingItems !== []) {
            foreach ($incomingItems as $item) {
                if (! is_array($item) || ! isset($item['hardware_id'])) {
                    continue;
                }

                $hardwareId = (int) $item['hardware_id'];
                $assetValueId = isset($item['hardware_asset_value_id']) && $item['hardware_asset_value_id'] !== null
                    ? (int) $item['hardware_asset_value_id']
                    : null;
                $itemKey = $assetValueId !== null ? 'asset:'.$assetValueId : 'hardware:'.$hardwareId;
                if ($hardwareId <= 0 || isset($items[$itemKey])) {
                    continue;
                }

                $serialNumber = isset($item['serial_number']) ? trim((string) $item['serial_number']) : '';
                $items[$itemKey] = [
                    'hardware_asset_value_id' => $assetValueId,
                    'hardware_id' => $hardwareId,
                    'serial_number' => $serialNumber !== '' ? $serialNumber : null,
                ];
            }

            return array_values($items);
        }

        $legacyHardwareIds = $data['hardware_ids'] ?? [];
        if (! is_array($legacyHardwareIds)) {
            return [];
        }

        $legacySerial = isset($data['serial_number']) ? trim((string) $data['serial_number']) : '';
        $legacySerial = $legacySerial !== '' ? $legacySerial : null;

        foreach ($legacyHardwareIds as $hardwareIdRaw) {
            $hardwareId = (int) $hardwareIdRaw;
            if ($hardwareId <= 0 || isset($items[$hardwareId])) {
                continue;
            }

            $items[$hardwareId] = [
                'hardware_asset_value_id' => null,
                'hardware_id' => $hardwareId,
                'serial_number' => count($legacyHardwareIds) === 1 ? $legacySerial : null,
            ];
        }

        return array_values($items);
    }

    /**
     * @param  array<int, array{hardware_asset_value_id: int|null, hardware_id: int, serial_number: string|null}>  $hardwareItems
     */
    private function deriveLegacySerialNumber(array $hardwareItems, mixed $fallback): ?string
    {
        if (count($hardwareItems) === 1) {
            return $hardwareItems[0]['serial_number'];
        }

        if (count($hardwareItems) > 1) {
            return null;
        }

        $legacySerial = trim((string) $fallback);

        return $legacySerial !== '' ? $legacySerial : null;
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
