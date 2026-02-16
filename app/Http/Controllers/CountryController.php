<?php

namespace App\Http\Controllers;

use App\Http\Requests\Country\StoreCountryRequest;
use App\Http\Requests\Country\UpdateCountryRequest;
use App\Models\Country;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CountryController extends Controller
{
    /**
     * Display a listing of the countries.
     */
    public function index(Request $request): Response
    {
        $countries = Country::query()
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($q) => $q->where('code', 'like', '%'.$request->search.'%')
                        ->orWhere('name', 'like', '%'.$request->search.'%')
                )
            )
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('countries/index', [
            'countries' => $countries,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new country.
     */
    public function create(): Response
    {
        return Inertia::render('countries/create');
    }

    /**
     * Store a newly created country.
     */
    public function store(StoreCountryRequest $request): RedirectResponse
    {
        Country::query()->create([
            'code' => strtoupper($request->validated('code')),
            'name' => $request->validated('name'),
        ]);

        return to_route('countries.index');
    }

    /**
     * Show the form for editing the specified country.
     */
    public function edit(Country $country): Response
    {
        return Inertia::render('countries/edit', [
            'country' => $country,
        ]);
    }

    /**
     * Update the specified country.
     */
    public function update(UpdateCountryRequest $request, Country $country): RedirectResponse
    {
        $country->update([
            'code' => strtoupper($request->validated('code')),
            'name' => $request->validated('name'),
        ]);

        return to_route('countries.index');
    }

    /**
     * Remove the specified country.
     */
    public function destroy(Country $country): RedirectResponse
    {
        $country->delete();

        return to_route('countries.index');
    }
}
