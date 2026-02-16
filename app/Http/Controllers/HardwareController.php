<?php

namespace App\Http\Controllers;

use App\Http\Requests\Hardware\StoreHardwareRequest;
use App\Http\Requests\Hardware\UpdateHardwareRequest;
use App\Models\Hardware;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HardwareController extends Controller
{
    /**
     * Display a listing of the hardware.
     */
    public function index(Request $request): Response
    {
        $hardware = Hardware::query()
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

        return Inertia::render('hardware/index', [
            'hardware' => $hardware,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new hardware.
     */
    public function create(): Response
    {
        return Inertia::render('hardware/create');
    }

    /**
     * Store a newly created hardware.
     */
    public function store(StoreHardwareRequest $request): RedirectResponse
    {
        Hardware::query()->create($request->validated());

        return to_route('hardware.index');
    }

    /**
     * Show the form for editing the specified hardware.
     */
    public function edit(Hardware $hardware): Response
    {
        return Inertia::render('hardware/edit', [
            'hardware' => $hardware,
        ]);
    }

    /**
     * Update the specified hardware.
     */
    public function update(UpdateHardwareRequest $request, Hardware $hardware): RedirectResponse
    {
        $hardware->update($request->validated());

        return to_route('hardware.index');
    }

    /**
     * Remove the specified hardware.
     */
    public function destroy(Hardware $hardware): RedirectResponse
    {
        $hardware->delete();

        return to_route('hardware.index');
    }
}
