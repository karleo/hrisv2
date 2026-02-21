<?php

namespace Tests\Feature;

use App\Models\CompanyProfile;
use App\Models\Country;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

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

        $response->assertRedirect(route('company-profiles.index'));
        $this->assertDatabaseHas('company_profiles', [
            'id' => $companyProfile->id,
            'company_name' => 'New Name',
            'company_address_1' => '456 New St',
            'country_id' => $country->id,
            'website' => 'https://new.example.com',
        ]);
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
