<?php

namespace App\Http\Controllers;

use App\Http\Requests\JobPosition\StoreJobPositionRequest;
use App\Http\Requests\JobPosition\UpdateJobPositionRequest;
use App\Models\JobPosition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobPositionController extends Controller
{
    /**
     * Display a listing of the job positions.
     */
    public function index(Request $request): Response
    {
        $jobPositions = JobPosition::query()
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

        return Inertia::render('job-positions/index', [
            'jobPositions' => $jobPositions,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new job position.
     */
    public function create(): Response
    {
        return Inertia::render('job-positions/create');
    }

    /**
     * Store a newly created job position.
     */
    public function store(StoreJobPositionRequest $request): RedirectResponse
    {
        JobPosition::query()->create($request->validated());

        return to_route('job-positions.index');
    }

    /**
     * Show the form for editing the specified job position.
     */
    public function edit(JobPosition $job_position): Response
    {
        return Inertia::render('job-positions/edit', [
            'jobPosition' => $job_position,
        ]);
    }

    /**
     * Update the specified job position.
     */
    public function update(UpdateJobPositionRequest $request, JobPosition $job_position): RedirectResponse
    {
        $job_position->update($request->validated());

        return to_route('job-positions.index');
    }

    /**
     * Remove the specified job position.
     */
    public function destroy(JobPosition $job_position): RedirectResponse
    {
        $job_position->delete();

        return to_route('job-positions.index');
    }
}
