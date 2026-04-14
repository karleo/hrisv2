<?php

namespace App\Http\Controllers;

use App\Http\Requests\LeaveType\StoreLeaveTypeRequest;
use App\Http\Requests\LeaveType\UpdateLeaveTypeRequest;
use App\Models\LeaveType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveTypeController extends Controller
{
    /**
     * Display a listing of the leave types.
     */
    public function index(Request $request): Response
    {
        $leaveTypes = LeaveType::query()
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($q) => $q->where('code', 'like', '%'.$request->search.'%')
                        ->orWhere('name', 'like', '%'.$request->search.'%')
                        ->orWhere('leave_category', 'like', '%'.$request->search.'%')
                        ->orWhere('description', 'like', '%'.$request->search.'%')
                )
            )
            ->orderBy('code')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('leave-types/index', [
            'leaveTypes' => $leaveTypes,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new leave type.
     */
    public function create(): Response
    {
        return Inertia::render('leave-types/create');
    }

    /**
     * Store a newly created leave type.
     */
    public function store(StoreLeaveTypeRequest $request): RedirectResponse
    {
        LeaveType::query()->create($request->validated());

        return to_route('leave-types.index');
    }

    /**
     * Show the form for editing the specified leave type.
     */
    public function edit(LeaveType $leave_type): Response
    {
        return Inertia::render('leave-types/edit', [
            'leaveType' => $leave_type,
        ]);
    }

    /**
     * Update the specified leave type.
     */
    public function update(UpdateLeaveTypeRequest $request, LeaveType $leave_type): RedirectResponse
    {
        $leave_type->update($request->validated());

        return to_route('leave-types.index');
    }

    /**
     * Remove the specified leave type.
     */
    public function destroy(LeaveType $leave_type): RedirectResponse
    {
        $leave_type->delete();

        return to_route('leave-types.index');
    }
}
