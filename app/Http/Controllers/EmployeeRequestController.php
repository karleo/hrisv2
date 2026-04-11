<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmployeeRequest\StoreEmployeeRequestRequest;
use App\Http\Requests\EmployeeRequest\UpdateEmployeeRequestRequest;
use App\Models\CompanyProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeRequest;
use App\Models\JobPosition;
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

class EmployeeRequestController extends Controller
{
    public function __construct(private readonly RequestApprovalScope $approvalScope) {}

    /**
     * Display a listing of the employee requests.
     */
    public function index(Request $request): Response
    {
        $employeeRequests = EmployeeRequest::query()
            ->with(['employee', 'department', 'jobPosition'])
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

        return Inertia::render('employee-requests/index', [
            'employeeRequests' => $employeeRequests,
            'filters' => $request->only('search'),
        ]);
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
        $this->assertCanView(request()->user(), $employee_request);
        $employee_request->load(['employee', 'department', 'jobPosition', 'approvedByEmployee']);

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
            'decisionUrl' => route('employee-requests.decide', $employee_request, false),
            'canDecide' => $this->approvalScope->canDecide(request()->user(), $employee_request->employee_id, $employee_request->department_id, (string) $employee_request->status),
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
        $this->assertCanModify(request()->user(), $employee_request);
        $employee_request->load(['employee', 'department', 'jobPosition', 'approvedByEmployee']);

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
            'canDecide' => $this->approvalScope->canDecide(request()->user(), $employee_request->employee_id, $employee_request->department_id, (string) $employee_request->status),
        ]);
    }

    /**
     * Update the specified employee request.
     */
    public function update(UpdateEmployeeRequestRequest $request, EmployeeRequest $employee_request): RedirectResponse
    {
        $this->assertCanModify($request->user(), $employee_request);
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
     * Remove the specified employee request.
     */
    public function destroy(EmployeeRequest $employee_request): RedirectResponse
    {
        $this->assertCanModify(request()->user(), $employee_request);
        if ($employee_request->employee_signature) {
            Storage::disk('public')->delete($employee_request->employee_signature);
        }
        if ($employee_request->approved_by_signature) {
            Storage::disk('public')->delete($employee_request->approved_by_signature);
        }
        if ($employee_request->dept_head_signature) {
            Storage::disk('public')->delete($employee_request->dept_head_signature);
        }
        if ($employee_request->ceo_signature) {
            Storage::disk('public')->delete($employee_request->ceo_signature);
        }

        $employee_request->delete();

        return to_route('employee-requests.index');
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
