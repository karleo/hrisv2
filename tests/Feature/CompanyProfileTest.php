<?php

namespace Tests\Feature;

use App\Models\CompanyProfile;
use App\Models\Country;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CompanyProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs(User::factory()->create());
    }

    public function test_index_displays_company_profiles(): void
    {
        CompanyProfile::factory()->count(2)->create();

        $response = $this->get(route('company-profiles.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('company-profiles/index')
            ->has('companyProfiles')
            ->has('companyProfiles.data', 2)
        );
    }

    public function test_create_displays_form(): void
    {
        $response = $this->get(route('company-profiles.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('company-profiles/create')
            ->has('countries')
        );
    }

    public function test_store_creates_company_profile(): void
    {
        $country = Country::factory()->create();
        $data = [
            'company_name' => 'Acme Inc.',
            'company_address_1' => '123 Main St',
            'company_address_2' => 'Suite 100',
            'country_id' => (string) $country->id,
            'website' => 'https://acme.example.com',
        ];

        $response = $this->post(route('company-profiles.store'), $data);

        $response->assertRedirect(route('company-profiles.index'));
        $this->assertDatabaseHas('company_profiles', [
            'company_name' => 'Acme Inc.',
            'company_address_1' => '123 Main St',
            'company_address_2' => 'Suite 100',
            'country_id' => $country->id,
            'website' => 'https://acme.example.com',
        ]);
    }

    public function test_store_uploads_business_card_logo(): void
    {
        Storage::fake('public');

        $response = $this->post(route('company-profiles.store'), [
            'company_name' => 'Prime Logistics',
            'website' => 'https://prime.example.com',
            'business_card_logo' => UploadedFile::fake()->image('business-card-logo.png'),
            'business_card_back_logo_1' => UploadedFile::fake()->image('prime-logo.png'),
            'business_card_back_logo_4' => UploadedFile::fake()->image('fourth-logo.png'),
        ]);

        $response->assertRedirect(route('company-profiles.index'));

        $companyProfile = CompanyProfile::query()
            ->where('company_name', 'Prime Logistics')
            ->firstOrFail();

        $this->assertNotNull($companyProfile->business_card_logo);
        $this->assertNotNull($companyProfile->business_card_back_logo_1);
        $this->assertNotNull($companyProfile->business_card_back_logo_4);
        Storage::disk('public')->assertExists($companyProfile->business_card_logo);
        Storage::disk('public')->assertExists($companyProfile->business_card_back_logo_1);
        Storage::disk('public')->assertExists($companyProfile->business_card_back_logo_4);
    }

    public function test_store_validates_required_company_name(): void
    {
        $response = $this->post(route('company-profiles.store'), []);

        $response->assertSessionHasErrors(['company_name']);
    }

    public function test_edit_displays_form(): void
    {
        $companyProfile = CompanyProfile::factory()->create();

        $response = $this->get(route('company-profiles.edit', $companyProfile));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('company-profiles/edit')
            ->has('companyProfile')
            ->has('countries')
            ->where('companyProfile.id', $companyProfile->id)
        );
    }

    public function test_edit_includes_business_card_logo_url(): void
    {
        $companyProfile = CompanyProfile::factory()->create([
            'business_card_logo' => 'company-profiles/1/business-card-logo.png',
            'business_card_back_logo_1' => 'company-profiles/1/back-logo-1.png',
            'business_card_back_logo_4' => 'company-profiles/1/back-logo-4.png',
        ]);

        $response = $this->get(route('company-profiles.edit', $companyProfile));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('company-profiles/edit')
            ->where('companyProfile.business_card_logo_url', '/storage/company-profiles/1/business-card-logo.png')
            ->where('companyProfile.business_card_back_logo_1_url', '/storage/company-profiles/1/back-logo-1.png')
            ->where('companyProfile.business_card_back_logo_4_url', '/storage/company-profiles/1/back-logo-4.png')
            ->where('companyProfile.business_card_back_logo_urls.0', '/storage/company-profiles/1/back-logo-1.png')
            ->where('companyProfile.business_card_back_logo_urls.3', '/storage/company-profiles/1/back-logo-4.png')
        );
    }

    public function test_update_modifies_company_profile(): void
    {
        $companyProfile = CompanyProfile::factory()->create([
            'company_name' => 'Old Name',
        ]);
        $country = Country::factory()->create();

        $data = [
            'company_name' => 'New Name',
            'company_address_1' => '456 New St',
            'company_address_2' => null,
            'country_id' => (string) $country->id,
            'website' => 'https://new.example.com',
        ];

        $response = $this->patch(
            route('company-profiles.update', $companyProfile),
            $data
        );

        $response->assertRedirect(route('company-profiles.edit', $companyProfile));
        $this->assertDatabaseHas('company_profiles', [
            'id' => $companyProfile->id,
            'company_name' => 'New Name',
            'company_address_1' => '456 New St',
            'country_id' => $country->id,
            'website' => 'https://new.example.com',
        ]);
    }

    public function test_update_replaces_business_card_logo(): void
    {
        Storage::fake('public');

        $companyProfile = CompanyProfile::factory()->create([
            'business_card_logo' => UploadedFile::fake()
                ->image('old-business-card-logo.png')
                ->store('company-profiles/1', 'public'),
            'business_card_back_logo_2' => UploadedFile::fake()
                ->image('old-back-logo.png')
                ->store('company-profiles/1', 'public'),
        ]);
        $oldLogo = $companyProfile->business_card_logo;
        $oldBackLogo = $companyProfile->business_card_back_logo_2;

        $response = $this->patch(route('company-profiles.update', $companyProfile), [
            'company_name' => $companyProfile->company_name,
            'business_card_logo' => UploadedFile::fake()->image('new-business-card-logo.png'),
            'business_card_back_logo_2' => UploadedFile::fake()->image('new-back-logo.png'),
        ]);

        $response->assertRedirect(route('company-profiles.edit', $companyProfile));

        $companyProfile->refresh();

        $this->assertNotSame($oldLogo, $companyProfile->business_card_logo);
        $this->assertNotSame($oldBackLogo, $companyProfile->business_card_back_logo_2);
        Storage::disk('public')->assertMissing($oldLogo);
        Storage::disk('public')->assertMissing($oldBackLogo);
        Storage::disk('public')->assertExists($companyProfile->business_card_logo);
        Storage::disk('public')->assertExists($companyProfile->business_card_back_logo_2);
    }

    public function test_destroy_deletes_company_profile(): void
    {
        $companyProfile = CompanyProfile::factory()->create();

        $response = $this->delete(
            route('company-profiles.destroy', $companyProfile)
        );

        $response->assertRedirect(route('company-profiles.index'));
        $this->assertDatabaseMissing('company_profiles', [
            'id' => $companyProfile->id,
        ]);
    }

    public function test_company_profiles_require_authentication(): void
    {
        $this->post(route('logout'));

        $this->get(route('company-profiles.index'))->assertRedirect();
        $this->get(route('company-profiles.create'))->assertRedirect();
        $this->post(route('company-profiles.store'), [])->assertRedirect();
    }
}
