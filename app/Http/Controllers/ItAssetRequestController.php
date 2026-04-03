<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItAssetRequest\StoreItAssetRequestRequest;
use App\Http\Requests\ItAssetRequest\UpdateItAssetRequestRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\ItAssetRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ItAssetRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $itAssetRequests = ItAssetRequest::query()
            ->with(['employee', 'department'])
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
    public function create(): Response
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
        ]);
    }

    /**
     * Submit a draft IT asset request.
     */
    public function submit(ItAssetRequest $it_asset_request): RedirectResponse
    {
        if (strtolower((string) $it_asset_request->status) !== 'draft') {
            return redirect()->back()->with('error', 'Only draft IT asset requests can be submitted.');
        }

        $it_asset_request->update(['status' => 'submitted']);

        return redirect()
            ->route('it-asset-requests.index')
            ->with('success', 'IT asset request submitted.');
    }

    /**
     * Show printable IT Asset request.
     */
    public function print(ItAssetRequest $it_asset_request): Response
    {
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
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateItAssetRequestRequest $request, ItAssetRequest $it_asset_request): RedirectResponse
    {
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
}
