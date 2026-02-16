<?php

namespace Tests\Feature;

use App\Models\Hardware;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HardwareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
    }

    public function test_index_displays_hardware(): void
    {
        Hardware::factory()->count(3)->create();

        $response = $this->get(route('hardware.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('hardware/index')
            ->has('hardware')
            ->has('hardware.data', 3)
        );
    }

    public function test_create_displays_form(): void
    {
        $response = $this->get(route('hardware.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('hardware/create'));
    }

    public function test_store_creates_hardware(): void
    {
        $data = [
            'code' => 'CPU',
            'name' => 'Processor (CPU)',
            'description' => 'Central Processing Unit',
        ];

        $response = $this->post(route('hardware.store'), $data);

        $response->assertRedirect(route('hardware.index'));
        $this->assertDatabaseHas('hardware', $data);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->post(route('hardware.store'), []);

        $response->assertSessionHasErrors(['code', 'name']);
    }

    public function test_store_validates_unique_code(): void
    {
        Hardware::factory()->create(['code' => 'CPU']);

        $response = $this->post(route('hardware.store'), [
            'code' => 'CPU',
            'name' => 'Processor (CPU)',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_edit_displays_form(): void
    {
        $hardware = Hardware::factory()->create();

        $response = $this->get(route('hardware.edit', $hardware));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('hardware/edit')
            ->has('hardware')
            ->where('hardware.id', $hardware->id)
        );
    }

    public function test_update_modifies_hardware(): void
    {
        $hardware = Hardware::factory()->create([
            'code' => 'CPU',
            'name' => 'Processor (CPU)',
        ]);

        $data = [
            'code' => 'RAM',
            'name' => 'Memory (RAM)',
            'description' => 'Random Access Memory',
        ];

        $response = $this->patch(route('hardware.update', $hardware), $data);

        $response->assertRedirect(route('hardware.index'));
        $this->assertDatabaseHas('hardware', array_merge($data, ['id' => $hardware->id]));
    }

    public function test_update_validates_unique_code_excluding_current(): void
    {
        $hardware = Hardware::factory()->create(['code' => 'CPU']);
        Hardware::factory()->create(['code' => 'RAM']);

        $response = $this->patch(route('hardware.update', $hardware), [
            'code' => 'RAM',
            'name' => 'Processor (CPU)',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_destroy_deletes_hardware(): void
    {
        $hardware = Hardware::factory()->create();

        $response = $this->delete(route('hardware.destroy', $hardware));

        $response->assertRedirect(route('hardware.index'));
        $this->assertDatabaseMissing('hardware', ['id' => $hardware->id]);
    }

    public function test_hardware_require_authentication(): void
    {
        $this->post(route('logout'));

        $this->get(route('hardware.index'))->assertRedirect();
        $this->get(route('hardware.create'))->assertRedirect();
        $this->post(route('hardware.store'), [])->assertRedirect();
    }
}
