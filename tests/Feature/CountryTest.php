<?php

namespace Tests\Feature;

use App\Models\Country;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CountryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
    }

    public function test_index_displays_countries(): void
    {
        Country::factory()->count(3)->create();

        $response = $this->get(route('countries.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('countries/index')
            ->has('countries')
            ->has('countries.data', 3)
        );
    }

    public function test_create_displays_form(): void
    {
        $response = $this->get(route('countries.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('countries/create'));
    }

    public function test_store_creates_country(): void
    {
        $data = [
            'code' => 'US',
            'name' => 'United States',
        ];

        $response = $this->post(route('countries.store'), $data);

        $response->assertRedirect(route('countries.index'));
        $this->assertDatabaseHas('countries', $data);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->post(route('countries.store'), []);

        $response->assertSessionHasErrors(['code', 'name']);
    }

    public function test_store_validates_unique_code(): void
    {
        Country::factory()->create(['code' => 'US']);

        $response = $this->post(route('countries.store'), [
            'code' => 'US',
            'name' => 'United States',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_edit_displays_form(): void
    {
        $country = Country::factory()->create();

        $response = $this->get(route('countries.edit', $country));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('countries/edit')
            ->has('country')
            ->where('country.id', $country->id)
        );
    }

    public function test_update_modifies_country(): void
    {
        $country = Country::factory()->create([
            'code' => 'US',
            'name' => 'United States',
        ]);

        $data = [
            'code' => 'CA',
            'name' => 'Canada',
        ];

        $response = $this->patch(route('countries.update', $country), $data);

        $response->assertRedirect(route('countries.index'));
        $this->assertDatabaseHas('countries', array_merge($data, ['id' => $country->id]));
    }

    public function test_update_validates_unique_code_excluding_current(): void
    {
        $country = Country::factory()->create(['code' => 'US']);
        Country::factory()->create(['code' => 'CA']);

        $response = $this->patch(route('countries.update', $country), [
            'code' => 'CA',
            'name' => 'United States',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_destroy_deletes_country(): void
    {
        $country = Country::factory()->create();

        $response = $this->delete(route('countries.destroy', $country));

        $response->assertRedirect(route('countries.index'));
        $this->assertDatabaseMissing('countries', ['id' => $country->id]);
    }

    public function test_countries_require_authentication(): void
    {
        $this->post(route('logout'));

        $this->get(route('countries.index'))->assertRedirect();
        $this->get(route('countries.create'))->assertRedirect();
        $this->post(route('countries.store'), [])->assertRedirect();
    }
}
