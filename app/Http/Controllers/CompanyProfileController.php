<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompanyProfile\StoreCompanyProfileRequest;
use App\Http\Requests\CompanyProfile\UpdateCompanyProfileRequest;
use App\Models\CompanyProfile;
use App\Models\Country;
use App\Support\CompanyAccessScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanyProfileController extends Controller
{
    public function __construct(private readonly CompanyAccessScope $companyScope) {}

    /**
     * @var list<string>
     */
    private const BUSINESS_CARD_BACK_LOGO_COLUMNS = [
        'business_card_back_logo_1',
        'business_card_back_logo_2',
        'business_card_back_logo_3',
        'business_card_back_logo_4',
    ];

    /**
     * Display a listing of the company profiles.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $companyProfiles = CompanyProfile::query()
            ->with('country')
            ->when(
                $this->companyScope->shouldScope($user),
                fn ($query) => $query->whereKey($this->companyScope->companyProfileIdFor($user))
            )
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
            $this->attachLogoUrls($profile);

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
    public function create(Request $request): Response
    {
        if ($this->companyScope->shouldScope($request->user())) {
            abort(403);
        }

        return Inertia::render('company-profiles/create', [
            'countries' => Country::query()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    /**
     * Store a newly created company profile.
     */
    public function store(StoreCompanyProfileRequest $request): RedirectResponse
    {
        if ($this->companyScope->shouldScope($request->user())) {
            abort(403);
        }

        $data = $request->validated();
        $logo = $data['logo'] ?? null;
        $businessCardLogo = $data['business_card_logo'] ?? null;
        $businessCardBackLogos = $this->extractBusinessCardBackLogos($data);
        unset($data['logo'], $data['business_card_logo']);
        foreach (self::BUSINESS_CARD_BACK_LOGO_COLUMNS as $column) {
            unset($data[$column]);
        }

        $companyProfile = CompanyProfile::query()->create($data);

        $this->storeUploadedLogos($companyProfile, $logo, $businessCardLogo, $businessCardBackLogos);

        return to_route('company-profiles.index');
    }

    /**
     * Show the form for editing the specified company profile.
     */
    public function edit(Request $request, CompanyProfile $companyProfile): Response
    {
        $this->companyScope->assertCanAccessCompanyProfile($request->user(), (int) $companyProfile->id);

        $companyProfile->load('country');
        $this->attachLogoUrls($companyProfile);

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
        $this->companyScope->assertCanAccessCompanyProfile($request->user(), (int) $companyProfile->id);

        $data = $request->validated();
        $logo = $data['logo'] ?? null;
        $businessCardLogo = $data['business_card_logo'] ?? null;
        $businessCardBackLogos = $this->extractBusinessCardBackLogos($data);
        unset($data['logo'], $data['business_card_logo']);
        foreach (self::BUSINESS_CARD_BACK_LOGO_COLUMNS as $column) {
            unset($data[$column]);
        }

        $companyProfile->update($data);

        $this->storeUploadedLogos($companyProfile, $logo, $businessCardLogo, $businessCardBackLogos, deleteExisting: true);

        return to_route('company-profiles.index');
    }

    /**
     * Remove the specified company profile.
     */
    public function destroy(Request $request, CompanyProfile $companyProfile): RedirectResponse
    {
        if ($this->companyScope->shouldScope($request->user())) {
            abort(403);
        }

        if ($companyProfile->logo) {
            Storage::disk('public')->delete($companyProfile->logo);
        }
        if ($companyProfile->business_card_logo) {
            Storage::disk('public')->delete($companyProfile->business_card_logo);
        }
        foreach (self::BUSINESS_CARD_BACK_LOGO_COLUMNS as $column) {
            if ($companyProfile->{$column}) {
                Storage::disk('public')->delete($companyProfile->{$column});
            }
        }
        Storage::disk('public')->deleteDirectory('company-profiles/'.$companyProfile->id);
        $companyProfile->delete();

        return to_route('company-profiles.index');
    }

    private function attachLogoUrls(CompanyProfile $companyProfile): void
    {
        $companyProfile->logo_url = $companyProfile->logo
            ? '/storage/'.ltrim($companyProfile->logo, '/')
            : null;
        $companyProfile->business_card_logo_url = $companyProfile->business_card_logo
            ? '/storage/'.ltrim($companyProfile->business_card_logo, '/')
            : null;
        $companyProfile->business_card_back_logo_urls = array_map(
            static fn (string $column): ?string => $companyProfile->{$column}
                ? '/storage/'.ltrim($companyProfile->{$column}, '/')
                : null,
            self::BUSINESS_CARD_BACK_LOGO_COLUMNS,
        );
        foreach (self::BUSINESS_CARD_BACK_LOGO_COLUMNS as $column) {
            $companyProfile->{$column.'_url'} = $companyProfile->{$column}
                ? '/storage/'.ltrim($companyProfile->{$column}, '/')
                : null;
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, UploadedFile|null>
     */
    private function extractBusinessCardBackLogos(array $data): array
    {
        $businessCardBackLogos = [];

        foreach (self::BUSINESS_CARD_BACK_LOGO_COLUMNS as $column) {
            $file = $data[$column] ?? null;
            $businessCardBackLogos[$column] = $file instanceof UploadedFile ? $file : null;
        }

        return $businessCardBackLogos;
    }

    /**
     * @param  array<string, UploadedFile|null>  $businessCardBackLogos
     */
    private function storeUploadedLogos(
        CompanyProfile $companyProfile,
        ?UploadedFile $logo,
        ?UploadedFile $businessCardLogo,
        array $businessCardBackLogos = [],
        bool $deleteExisting = false,
    ): void {
        $updates = [];

        if ($logo instanceof UploadedFile) {
            if ($deleteExisting && $companyProfile->logo) {
                Storage::disk('public')->delete($companyProfile->logo);
            }

            $updates['logo'] = $logo->store('company-profiles/'.$companyProfile->id, 'public');
        }

        if ($businessCardLogo instanceof UploadedFile) {
            if ($deleteExisting && $companyProfile->business_card_logo) {
                Storage::disk('public')->delete($companyProfile->business_card_logo);
            }

            $updates['business_card_logo'] = $businessCardLogo->store('company-profiles/'.$companyProfile->id, 'public');
        }

        foreach ($businessCardBackLogos as $column => $businessCardBackLogo) {
            if (! in_array($column, self::BUSINESS_CARD_BACK_LOGO_COLUMNS, true) || ! $businessCardBackLogo instanceof UploadedFile) {
                continue;
            }

            if ($deleteExisting && $companyProfile->{$column}) {
                Storage::disk('public')->delete($companyProfile->{$column});
            }

            $updates[$column] = $businessCardBackLogo->store('company-profiles/'.$companyProfile->id, 'public');
        }

        if ($updates !== []) {
            $companyProfile->update($updates);
        }
    }
}
