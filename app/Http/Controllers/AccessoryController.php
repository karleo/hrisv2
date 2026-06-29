<?php

namespace App\Http\Controllers;

use App\Http\Requests\Accessory\StoreAccessoryRequest;
use App\Http\Requests\Accessory\UpdateAccessoryRequest;
use App\Models\Accessory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccessoryController extends Controller
{
    public function index(Request $request): Response
    {
        $accessories = Accessory::query()
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

        return Inertia::render('accessories/index', [
            'accessories' => $accessories,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('accessories/create');
    }

    public function store(StoreAccessoryRequest $request): RedirectResponse
    {
        Accessory::query()->create($request->validated());

        return to_route('accessories.index');
    }

    public function edit(Accessory $accessory): Response
    {
        return Inertia::render('accessories/edit', [
            'accessory' => $accessory,
        ]);
    }

    public function update(UpdateAccessoryRequest $request, Accessory $accessory): RedirectResponse
    {
        $accessory->update($request->validated());

        return to_route('accessories.index');
    }

    public function destroy(Accessory $accessory): RedirectResponse
    {
        $accessory->delete();

        return to_route('accessories.index');
    }
}
