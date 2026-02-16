<?php

namespace Tests\Feature;

use App\Models\Software;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SoftwareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
    }

    public function test_index_displays_software(): void
    {
        Software::factory()->count(3)->create();

        $response = $this->get(route('software.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('software/index')
            ->has('software')
            ->has('software.data', 3)
        );
    }

    public function test_create_displays_form(): void
    {
        $response = $this->get(route('software.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('software/create'));
    }

    public function test_store_creates_software(): void
    {
        $data = [
            'code' => 'RITZY',
            'name' => 'Ritzy',
            'description' => 'Ritzy system/application',
        ];

        $response = $this->post(route('software.store'), $data);

        $response->assertRedirect(route('software.index'));
        $this->assertDatabaseHas('software', $data);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->post(route('software.store'), []);

        $response->assertSessionHasErrors(['code', 'name']);
    }

    public function test_store_validates_unique_code(): void
    {
        Software::factory()->create(['code' => 'RITZY']);

        $response = $this->post(route('software.store'), [
            'code' => 'RITZY',
            'name' => 'Ritzy',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_edit_displays_form(): void
    {
        $software = Software::factory()->create();

        $response = $this->get(route('software.edit', $software));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('software/edit')
            ->has('software')
            ->where('software.id', $software->id)
        );
    }

    public function test_update_modifies_software(): void
    {
        $software = Software::factory()->create([
            'code' => 'RITZY',
            'name' => 'Ritzy',
        ]);

        $data = [
            'code' => 'FLAIR',
            'name' => 'Flair',
            'description' => 'Flair system/application',
        ];

        $response = $this->patch(route('software.update', $software), $data);

        $response->assertRedirect(route('software.index'));
        $this->assertDatabaseHas('software', array_merge($data, ['id' => $software->id]));
    }

    public function test_update_validates_unique_code_excluding_current(): void
    {
        $software = Software::factory()->create(['code' => 'RITZY']);
        Software::factory()->create(['code' => 'FLAIR']);

        $response = $this->patch(route('software.update', $software), [
            'code' => 'FLAIR',
            'name' => 'Ritzy',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_destroy_deletes_software(): void
    {
        $software = Software::factory()->create();

        $response = $this->delete(route('software.destroy', $software));

        $response->assertRedirect(route('software.index'));
        $this->assertDatabaseMissing('software', ['id' => $software->id]);
    }

    public function test_software_require_authentication(): void
    {
        $this->post(route('logout'));

        $this->get(route('software.index'))->assertRedirect();
        $this->get(route('software.create'))->assertRedirect();
        $this->post(route('software.store'), [])->assertRedirect();
    }
}
