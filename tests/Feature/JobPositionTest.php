<?php

namespace Tests\Feature;

use App\Models\JobPosition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JobPositionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
    }

    public function test_index_displays_job_positions(): void
    {
        JobPosition::factory()->count(3)->create();

        $response = $this->get(route('job-positions.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('job-positions/index')
            ->has('jobPositions')
            ->has('jobPositions.data', 3)
        );
    }

    public function test_create_displays_form(): void
    {
        $response = $this->get(route('job-positions.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('job-positions/create'));
    }

    public function test_store_creates_job_position(): void
    {
        $data = [
            'code' => 'POS-001',
            'name' => 'Software Engineer',
            'description' => 'Develops and maintains software applications',
        ];

        $response = $this->post(route('job-positions.store'), $data);

        $response->assertRedirect(route('job-positions.index'));
        $this->assertDatabaseHas('job_positions', $data);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->post(route('job-positions.store'), []);

        $response->assertSessionHasErrors(['code', 'name']);
    }

    public function test_store_validates_unique_code(): void
    {
        JobPosition::factory()->create(['code' => 'POS-001']);

        $response = $this->post(route('job-positions.store'), [
            'code' => 'POS-001',
            'name' => 'Software Engineer',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_edit_displays_form(): void
    {
        $jobPosition = JobPosition::factory()->create();

        $response = $this->get(route('job-positions.edit', $jobPosition));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('job-positions/edit')
            ->has('jobPosition')
            ->where('jobPosition.id', $jobPosition->id)
        );
    }

    public function test_update_modifies_job_position(): void
    {
        $jobPosition = JobPosition::factory()->create([
            'code' => 'POS-001',
            'name' => 'Software Engineer',
        ]);

        $data = [
            'code' => 'POS-002',
            'name' => 'Senior Developer',
            'description' => 'Senior software development role',
        ];

        $response = $this->patch(route('job-positions.update', $jobPosition), $data);

        $response->assertRedirect(route('job-positions.index'));
        $this->assertDatabaseHas('job_positions', array_merge($data, ['id' => $jobPosition->id]));
    }

    public function test_update_validates_unique_code_excluding_current(): void
    {
        $jobPosition = JobPosition::factory()->create(['code' => 'POS-001']);
        JobPosition::factory()->create(['code' => 'POS-002']);

        $response = $this->patch(route('job-positions.update', $jobPosition), [
            'code' => 'POS-002',
            'name' => 'Software Engineer',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_destroy_deletes_job_position(): void
    {
        $jobPosition = JobPosition::factory()->create();

        $response = $this->delete(route('job-positions.destroy', $jobPosition));

        $response->assertRedirect(route('job-positions.index'));
        $this->assertDatabaseMissing('job_positions', ['id' => $jobPosition->id]);
    }

    public function test_job_positions_require_authentication(): void
    {
        $this->post(route('logout'));

        $this->get(route('job-positions.index'))->assertRedirect();
        $this->get(route('job-positions.create'))->assertRedirect();
        $this->post(route('job-positions.store'), [])->assertRedirect();
    }
}
