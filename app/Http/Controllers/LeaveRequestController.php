<?php

namespace App\Http\Controllers;

use App\Http\Requests\LeaveRequest\StoreLeaveRequestRequest;
use App\Http\Requests\LeaveRequest\UpdateLeaveRequestRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
    /**
     * Display a listing of the leave requests.
     */
    public function index(Request $request): Response
    {
        $leaveRequests = LeaveRequest::query()
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

        return Inertia::render('leave-requests/index', [
            'leaveRequests' => $leaveRequests,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new leave request.
     */
    public function create(): Response
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
        ]);
    }

    /**
     * Store a newly created leave request.
     */
    public function store(StoreLeaveRequestRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $status = $data['status'] ?? 'submitted';
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
            'status' => $status,
        ]);

        return to_route('leave-requests.show', $leaveRequest);
    }

    /**
     * Display the specified leave request.
     */
    public function show(LeaveRequest $leave_request): Response
    {
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
            'signaturesUrl' => route('leave-requests.signatures.update', $leave_request, false),
        ]);
    }

    /**
     * Show the form for editing the specified leave request.
     */
    public function edit(LeaveRequest $leave_request): Response
    {
        $leave_request->load(['employee', 'department']);

        return Inertia::render('leave-requests/edit', [
            'leaveRequest' => $leave_request,
            'employees' => Employee::query()
                ->with('department:id,name')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'department_id']),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified leave request.
     */
    public function update(UpdateLeaveRequestRequest $request, LeaveRequest $leave_request): RedirectResponse
    {
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
        $leave_request->load(['employee.companyProfile', 'department']);

        $company = $leave_request->employee?->companyProfile ?? CompanyProfile::query()->first();
        $companyName = $company?->company_name ?? config('app.name');
        $companyLogoUrl = $this->publicStorageBrowserUrl($company?->logo);

        $employeeSignatureUrl = $this->publicStorageBrowserUrl($leave_request->employee_signature);
        $approvedBySignatureUrl = $this->publicStorageBrowserUrl($leave_request->approved_by_signature);

        return Inertia::render('leave-requests/print', [
            'leaveRequest' => array_merge($leave_request->toArray(), [
                'employee_signature_url' => $employeeSignatureUrl,
                'approved_by_signature_url' => $approvedBySignatureUrl,
            ]),
            'companyName' => $companyName,
            'companyLogoUrl' => $companyLogoUrl,
        ]);
    }

    /**
     * Update signatures for the Leave Request (sign in web portal).
     */
    public function updateSignatures(Request $request, LeaveRequest $leave_request): RedirectResponse
    {
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
}
