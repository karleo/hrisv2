<?php

namespace Tests\Feature;

use App\Models\Accessory;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccessoryMasterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs(User::factory()->create());
    }

    public function test_store_creates_accessory(): void
    {
        $response = $this->post(route('accessories.store'), [
            'code' => 'MOU',
            'name' => 'Mouse',
            'description' => 'Standard mouse',
        ]);

        $response->assertRedirect(route('accessories.index'));
        $this->assertDatabaseHas('accessories', [
            'code' => 'MOU',
            'name' => 'Mouse',
        ]);
    }

    public function test_index_lists_accessories(): void
    {
        Accessory::factory()->create(['code' => 'KEY', 'name' => 'Keyboard']);

        $response = $this->get(route('accessories.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('accessories/index')
            ->has('accessories.data', 1)
            ->where('accessories.data.0.name', 'Keyboard')
        );
    }
}
