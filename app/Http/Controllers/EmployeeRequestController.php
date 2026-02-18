<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmployeeRequest\StoreEmployeeRequestRequest;
use App\Http\Requests\EmployeeRequest\UpdateEmployeeRequestRequest;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeRequest;
use App\Models\JobPosition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeRequestController extends Controller
{
    /**
     * Display a listing of the employee requests.
     */
    public function index(Request $request): Response
    {
        $employeeRequests = EmployeeRequest::query()
            ->with(['employee', 'department', 'jobPosition'])
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
    public function create(): Response
    {
        return Inertia::render('employee-requests/create', [
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'jobPositions' => JobPosition::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created employee request.
     */
    public function store(StoreEmployeeRequestRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $status = $data['status'] ?? 'submitted';

        EmployeeRequest::query()->create([
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
            'status' => $status,
        ]);

        return to_route('employee-requests.index');
    }

    /**
     * Display the specified employee request.
     */
    public function show(EmployeeRequest $employee_request): Response
    {
        $employee_request->load(['employee', 'department', 'jobPosition']);

        return Inertia::render('employee-requests/show', [
            'employeeRequest' => $employee_request,
        ]);
    }

    /**
     * Show the form for editing the specified employee request.
     */
    public function edit(EmployeeRequest $employee_request): Response
    {
        $employee_request->load(['employee', 'department', 'jobPosition']);

        return Inertia::render('employee-requests/edit', [
            'employeeRequest' => $employee_request,
            'employees' => Employee::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
            'departments' => Department::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'jobPositions' => JobPosition::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified employee request.
     */
    public function update(UpdateEmployeeRequestRequest $request, EmployeeRequest $employee_request): RedirectResponse
    {
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
            'status' => $status,
        ]);

        return to_route('employee-requests.index');
    }

    /**
     * Remove the specified employee request.
     */
    public function destroy(EmployeeRequest $employee_request): RedirectResponse
    {
        $employee_request->delete();

        return to_route('employee-requests.index');
    }
}
