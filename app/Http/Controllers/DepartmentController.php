<?php

namespace App\Http\Controllers;

use App\Http\Requests\Department\StoreDepartmentRequest;
use App\Http\Requests\Department\UpdateDepartmentRequest;
use App\Models\Department;
use App\Support\CompanyAccessScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function __construct(private readonly CompanyAccessScope $companyScope) {}

    /**
     * Display a listing of the departments.
     */
    public function index(Request $request): Response
    {
        $departments = Department::query()
            ->with('managerEmployee:id,first_name,last_name')
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($q) => $q->where('code', 'like', '%'.$request->search.'%')
                        ->orWhere('name', 'like', '%'.$request->search.'%')
                        ->orWhere('description', 'like', '%'.$request->search.'%')
                )
            )
            ->orderBy('code')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('departments/index', [
            'departments' => $departments,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new department.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('departments/create', [
            'employees' => Inertia::always(fn () => $this->companyScope->scopedEmployeeQuery($request->user())
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name'])),
        ]);
    }

    /**
     * Store a newly created department.
     */
    public function store(StoreDepartmentRequest $request): RedirectResponse
    {
        Department::query()->create($request->validated());

        return to_route('departments.index');
    }

    /**
     * Show the form for editing the specified department.
     */
    public function edit(Request $request, Department $department): Response
    {
        return Inertia::render('departments/edit', [
            'department' => $department,
            'employees' => Inertia::always(fn () => $this->companyScope->scopedEmployeeQuery($request->user())
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name'])),
        ]);
    }

    /**
     * Update the specified department.
     */
    public function update(UpdateDepartmentRequest $request, Department $department): RedirectResponse
    {
        $department->update($request->validated());

        return to_route('departments.index');
    }

    /**
     * Remove the specified department.
     */
    public function destroy(Department $department): RedirectResponse
    {
        $department->delete();

        return to_route('departments.index');
    }
}
