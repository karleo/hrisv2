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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ItRequestController extends Controller
{
    /**
     * Display a listing of the IT requests.
     */
    public function index(Request $request): Response
    {
        $itRequests = ItRequest::query()
            ->with(['employee', 'department'])
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

        $status = $data['status'] ?? 'submitted';
        $date = $data['date'] ?? now()->toDateString();

        $itRequest = ItRequest::query()->create([
            'employee_id' => $data['employee_id'],
            'department_id' => $data['department_id'],
            'software_id' => $data['software_id'] ?? null,
            'hardware_id' => $data['hardware_id'] ?? null,
            'status' => $status,
            'date' => $date,
        ]);

        return to_route('it-requests.show', $itRequest);
    }

    /**
     * Display the specified IT request.
     */
    public function show(ItRequest $it_request): Response
    {
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
            'signaturesUrl' => route('it-requests.signatures.update', $it_request, false),
        ]);
    }

    /**
     * Show printable IT request.
     */
    public function print(ItRequest $it_request): Response
    {
        $it_request->load(['employee.companyProfile', 'department', 'software', 'hardware']);

        $company = $it_request->employee?->companyProfile ?? CompanyProfile::query()->first();
        $companyName = $company?->company_name ?? config('app.name');
        $companyLogoUrl = $this->publicStorageBrowserUrl($company?->logo);

        $employeeSignatureUrl = $this->publicStorageBrowserUrl($it_request->employee_signature);
        $approvedBySignatureUrl = $this->publicStorageBrowserUrl($it_request->approved_by_signature);

        return Inertia::render('it-requests/print', [
            'itRequest' => array_merge($it_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
            ]),
            'companyName' => $companyName,
            'companyLogoUrl' => $companyLogoUrl,
        ]);
    }

    /**
     * Show the form for editing the specified IT request.
     */
    public function edit(ItRequest $it_request): Response
    {
        $it_request->load(['employee', 'department', 'software', 'hardware']);

        return Inertia::render('it-requests/edit', [
            'itRequest' => $it_request,
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
     * Update the specified IT request.
     */
    public function update(UpdateItRequestRequest $request, ItRequest $it_request): RedirectResponse
    {
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
