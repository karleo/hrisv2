<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
    }

    public function test_index_displays_departments(): void
    {
        Department::factory()->count(3)->create();

        $response = $this->get(route('departments.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('departments/index')
            ->has('departments')
            ->has('departments.data', 3)
        );
    }

    public function test_create_displays_form(): void
    {
        $response = $this->get(route('departments.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('departments/create')
            ->has('employees'));
    }

    public function test_store_creates_department(): void
    {
        $data = [
            'code' => 'DEPT-001',
            'name' => 'Engineering',
            'description' => 'Software development team',
        ];

        $response = $this->post(route('departments.store'), $data);

        $response->assertRedirect(route('departments.index'));
        $this->assertDatabaseHas('departments', $data);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->post(route('departments.store'), []);

        $response->assertSessionHasErrors(['code', 'name']);
    }

    public function test_store_validates_unique_code(): void
    {
        Department::factory()->create(['code' => 'DEPT-001']);

        $response = $this->post(route('departments.store'), [
            'code' => 'DEPT-001',
            'name' => 'Engineering',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_edit_displays_form(): void
    {
        $department = Department::factory()->create();

        $response = $this->get(route('departments.edit', $department));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('departments/edit')
            ->has('department')
            ->where('department.id', $department->id)
        );
    }

    public function test_update_modifies_department(): void
    {
        $department = Department::factory()->create([
            'code' => 'DEPT-001',
            'name' => 'Engineering',
        ]);

        $data = [
            'code' => 'DEPT-002',
            'name' => 'Product',
            'description' => 'Product management',
        ];

        $response = $this->patch(route('departments.update', $department), $data);

        $response->assertRedirect(route('departments.index'));
        $this->assertDatabaseHas('departments', array_merge($data, ['id' => $department->id]));
    }

    public function test_update_validates_unique_code_excluding_current(): void
    {
        $department = Department::factory()->create(['code' => 'DEPT-001']);
        Department::factory()->create(['code' => 'DEPT-002']);

        $response = $this->patch(route('departments.update', $department), [
            'code' => 'DEPT-002',
            'name' => 'Engineering',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_destroy_deletes_department(): void
    {
        $department = Department::factory()->create();

        $response = $this->delete(route('departments.destroy', $department));

        $response->assertRedirect(route('departments.index'));
        $this->assertDatabaseMissing('departments', ['id' => $department->id]);
    }

    public function test_departments_require_authentication(): void
    {
        $this->post(route('logout'));

        $this->get(route('departments.index'))->assertRedirect();
        $this->get(route('departments.create'))->assertRedirect();
        $this->post(route('departments.store'), [])->assertRedirect();
    }
}
