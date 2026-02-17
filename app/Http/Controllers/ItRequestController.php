<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItRequest\StoreItRequestRequest;
use App\Http\Requests\ItRequest\UpdateItRequestRequest;
use App\Models\Department;
use App\Models\Employee;
use App\Models\ItRequest;
use App\Models\Software;
use App\Models\Hardware;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
                ->get(['id', 'first_name', 'last_name']),
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
        $it_request->load(['employee', 'department', 'software', 'hardware']);

        return Inertia::render('it-requests/show', [
            'itRequest' => $it_request,
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
                ->get(['id', 'first_name', 'last_name']),
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
        $it_request->delete();

        return to_route('it-requests.index');
    }
}
