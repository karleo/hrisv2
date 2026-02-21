<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompanyProfile\StoreCompanyProfileRequest;
use App\Http\Requests\CompanyProfile\UpdateCompanyProfileRequest;
use App\Models\CompanyProfile;
use App\Models\Country;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanyProfileController extends Controller
{
    /**
     * Display a listing of the company profiles.
     */
    public function index(Request $request): Response
    {
        $companyProfiles = CompanyProfile::query()
            ->with('country')
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($q) => $q->where('company_name', 'like', '%'.$request->search.'%')
                        ->orWhere('company_address_1', 'like', '%'.$request->search.'%')
                        ->orWhere('website', 'like', '%'.$request->search.'%')
                )
            )
            ->orderBy('company_name')
            ->paginate(25)
            ->withQueryString();

        $companyProfiles->getCollection()->transform(function (CompanyProfile $profile) {
            $profile->logo_url = $profile->logo
                ? '/storage/'.ltrim($profile->logo, '/')
                : null;

            return $profile;
        });

        return Inertia::render('company-profiles/index', [
            'companyProfiles' => $companyProfiles,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new company profile.
     */
    public function create(): Response
    {
        return Inertia::render('company-profiles/create', [
            'countries' => Country::query()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    /**
     * Store a newly created company profile.
     */
    public function store(StoreCompanyProfileRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $logo = $data['logo'] ?? null;
        unset($data['logo']);

        $companyProfile = CompanyProfile::query()->create($data);

        if ($logo) {
            $path = $logo->store('company-profiles/'.$companyProfile->id, 'public');
            $companyProfile->update(['logo' => $path]);
        }

        return to_route('company-profiles.index');
    }

    /**
     * Show the form for editing the specified company profile.
     */
    public function edit(CompanyProfile $companyProfile): Response
    {
        $companyProfile->load('country');
        $companyProfile->logo_url = $companyProfile->logo
            ? '/storage/'.ltrim($companyProfile->logo, '/')
            : null;

        return Inertia::render('company-profiles/edit', [
            'companyProfile' => $companyProfile,
            'countries' => Country::query()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    /**
     * Update the specified company profile.
     */
    public function update(UpdateCompanyProfileRequest $request, CompanyProfile $companyProfile): RedirectResponse
    {
        $data = $request->validated();
        $logo = $data['logo'] ?? null;
        unset($data['logo']);

        $companyProfile->update($data);

        if ($logo) {
            if ($companyProfile->logo) {
                Storage::disk('public')->delete($companyProfile->logo);
            }
            $path = $logo->store('company-profiles/'.$companyProfile->id, 'public');
            $companyProfile->update(['logo' => $path]);
        }

        return to_route('company-profiles.index');
    }

    /**
     * Remove the specified company profile.
     */
    public function destroy(CompanyProfile $companyProfile): RedirectResponse
    {
        if ($companyProfile->logo) {
            Storage::disk('public')->delete($companyProfile->logo);
        }
        Storage::disk('public')->deleteDirectory('company-profiles/'.$companyProfile->id);
        $companyProfile->delete();

        return to_route('company-profiles.index');
    }
}
