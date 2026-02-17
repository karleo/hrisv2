<?php

namespace App\Http\Controllers;

use App\Http\Requests\LeaveRequest\StoreLeaveRequestRequest;
use App\Http\Requests\LeaveRequest\UpdateLeaveRequestRequest;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
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
        $leave_request->load(['employee', 'department']);

        return Inertia::render('leave-requests/show', [
            'leaveRequest' => $leave_request,
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
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
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
        $leave_request->delete();

        return to_route('leave-requests.index');
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
}
