<?php

namespace App\Http\Controllers;

use App\Http\Requests\Software\StoreSoftwareRequest;
use App\Http\Requests\Software\UpdateSoftwareRequest;
use App\Models\Software;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SoftwareController extends Controller
{
    /**
     * Display a listing of the software.
     */
    public function index(Request $request): Response
    {
        $software = Software::query()
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

        return Inertia::render('software/index', [
            'software' => $software,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new software.
     */
    public function create(): Response
    {
        return Inertia::render('software/create');
    }

    /**
     * Store a newly created software.
     */
    public function store(StoreSoftwareRequest $request): RedirectResponse
    {
        Software::query()->create($request->validated());

        return to_route('software.index');
    }

    /**
     * Show the form for editing the specified software.
     */
    public function edit(Software $software): Response
    {
        return Inertia::render('software/edit', [
            'software' => $software,
        ]);
    }

    /**
     * Update the specified software.
     */
    public function update(UpdateSoftwareRequest $request, Software $software): RedirectResponse
    {
        $software->update($request->validated());

        return to_route('software.index');
    }

    /**
     * Remove the specified software.
     */
    public function destroy(Software $software): RedirectResponse
    {
        $software->delete();

        return to_route('software.index');
    }
}
