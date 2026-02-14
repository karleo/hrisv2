<?php

namespace App\Http\Controllers;

use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the employees.
     */
    public function index(Request $request): Response
    {
        $employees = Employee::query()
            ->with(['department', 'jobPosition'])
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($q) => $q->where('employee_code', 'like', '%'.$request->search.'%')
                        ->orWhere('first_name', 'like', '%'.$request->search.'%')
                        ->orWhere('last_name', 'like', '%'.$request->search.'%')
                        ->orWhere('email_address', 'like', '%'.$request->search.'%')
                        ->orWhere('contact_number', 'like', '%'.$request->search.'%')
                )
            )
            ->orderBy('employee_code')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('employees/index', [
            'employees' => $employees,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new employee.
     */
    public function create(): Response
    {
        return Inertia::render('employees/create', [
            'departments' => Department::query()->orderBy('code')->get(['id', 'code', 'name']),
            'jobPositions' => JobPosition::query()->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    /**
     * Store a newly created employee.
     */
    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        Employee::query()->create($request->validated());

        return to_route('employees.index');
    }

    /**
     * Show the form for editing the specified employee.
     */
    public function edit(Employee $employee): Response
    {
        $employee->load(['department', 'jobPosition']);

        return Inertia::render('employees/edit', [
            'employee' => $employee,
            'departments' => Department::query()->orderBy('code')->get(['id', 'code', 'name']),
            'jobPositions' => JobPosition::query()->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    /**
     * Update the specified employee.
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $employee->update($request->validated());

        return to_route('employees.index');
    }

    /**
     * Remove the specified employee.
     */
    public function destroy(Employee $employee): RedirectResponse
    {
        $employee->delete();

        return to_route('employees.index');
    }
}
