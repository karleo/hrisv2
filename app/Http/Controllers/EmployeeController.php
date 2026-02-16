<?php

namespace App\Http\Controllers;

use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Models\JobPosition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
        $data = $request->validated();
        $photo = $data['photo'] ?? null;
        $companyLogo = $data['company_logo'] ?? null;
        $documents = $data['documents'] ?? [];
        $documentLabels = $request->input('document_labels', []);
        unset($data['photo'], $data['company_logo'], $data['documents'], $data['document_labels']);

        $employee = Employee::query()->create($data);

        if ($photo) {
            $path = $photo->store("employees/{$employee->id}", 'public');
            $employee->update(['photo' => $path]);
        }

        if ($companyLogo) {
            $path = $companyLogo->store("employees/{$employee->id}", 'public');
            $employee->update(['company_logo' => $path]);
        }

        foreach ($documents as $i => $file) {
            $path = $file->store("employees/{$employee->id}/documents", 'public');
            $label = trim($documentLabels[$i] ?? '') ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $employee->documents()->create([
                'name' => $label,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
            ]);
        }

        return to_route('employees.business-card', $employee);
    }

    /**
     * Display the employee business card (printable).
     */
    public function businessCard(Employee $employee): Response
    {
        $employee->load(['department', 'jobPosition']);
        $employee->photo_url = $employee->photo
            ? Storage::disk('public')->url($employee->photo)
            : null;
        $employee->company_logo_url = $employee->company_logo
            ? Storage::disk('public')->url($employee->company_logo)
            : null;

        return Inertia::render('employees/business-card', [
            'employee' => $employee,
            'appName' => config('app.name'),
        ]);
    }

    /**
     * Show the form for editing the specified employee.
     */
    public function edit(Employee $employee): Response
    {
        $employee->load(['department', 'jobPosition', 'documents']);
        $employee->photo_url = $employee->photo
            ? Storage::disk('public')->url($employee->photo)
            : null;
        $employee->company_logo_url = $employee->company_logo
            ? Storage::disk('public')->url($employee->company_logo)
            : null;

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
        $data = $request->validated();
        $photo = $data['photo'] ?? null;
        $companyLogo = $data['company_logo'] ?? null;
        $documents = $data['documents'] ?? [];
        $documentLabels = $request->input('document_labels', []);
        unset($data['photo'], $data['company_logo'], $data['documents'], $data['document_labels']);

        $employee->update($data);

        if ($photo) {
            if ($employee->photo) {
                Storage::disk('public')->delete($employee->photo);
            }
            $path = $photo->store("employees/{$employee->id}", 'public');
            $employee->update(['photo' => $path]);
        }

        if ($companyLogo) {
            if ($employee->company_logo) {
                Storage::disk('public')->delete($employee->company_logo);
            }
            $path = $companyLogo->store("employees/{$employee->id}", 'public');
            $employee->update(['company_logo' => $path]);
        }

        foreach ($documents as $i => $file) {
            $path = $file->store("employees/{$employee->id}/documents", 'public');
            $label = trim($documentLabels[$i] ?? '') ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $employee->documents()->create([
                'name' => $label,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
            ]);
        }

        return to_route('employees.business-card', $employee);
    }

    /**
     * Remove the specified employee.
     */
    public function destroy(Employee $employee): RedirectResponse
    {
        if ($employee->photo) {
            Storage::disk('public')->delete($employee->photo);
        }
        if ($employee->company_logo) {
            Storage::disk('public')->delete($employee->company_logo);
        }
        foreach ($employee->documents as $document) {
            Storage::disk('public')->delete($document->path);
        }
        $employee->delete();

        return to_route('employees.index');
    }

    /**
     * Remove the specified document from the employee.
     */
    public function destroyDocument(Employee $employee, EmployeeDocument $employeeDocument): RedirectResponse
    {
        if ($employeeDocument->employee_id !== $employee->id) {
            abort(404);
        }
        Storage::disk('public')->delete($employeeDocument->path);
        $employeeDocument->delete();

        return back();
    }
}
