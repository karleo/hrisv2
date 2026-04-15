<?php

namespace Tests\Feature;

use App\Models\LeaveType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveTypeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
    }

    public function test_index_displays_leave_types(): void
    {
        LeaveType::factory()->count(3)->create();

        $response = $this->get(route('leave-types.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('leave-types/index')
            ->has('leaveTypes')
            ->has('leaveTypes.data', 3)
        );
    }

    public function test_create_displays_form(): void
    {
        $response = $this->get(route('leave-types.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('leave-types/create'));
    }

    public function test_store_creates_leave_type(): void
    {
        $data = [
            'code' => 'LV-001',
            'name' => 'Annual Leave',
            'leave_category' => 'paid',
            'description' => 'Paid annual leave',
        ];

        $response = $this->post(route('leave-types.store'), $data);

        $response->assertRedirect(route('leave-types.index'));
        $this->assertDatabaseHas('leave_types', $data);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->post(route('leave-types.store'), []);

        $response->assertSessionHasErrors(['code', 'name', 'leave_category']);
    }

    public function test_store_validates_unique_code(): void
    {
        LeaveType::factory()->create(['code' => 'LV-001']);

        $response = $this->post(route('leave-types.store'), [
            'code' => 'LV-001',
            'name' => 'Annual Leave',
            'leave_category' => 'paid',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_edit_displays_form(): void
    {
        $leaveType = LeaveType::factory()->create();

        $response = $this->get(route('leave-types.edit', $leaveType));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('leave-types/edit')
            ->has('leaveType')
            ->where('leaveType.id', $leaveType->id)
        );
    }

    public function test_update_modifies_leave_type(): void
    {
        $leaveType = LeaveType::factory()->create([
            'code' => 'LV-001',
            'name' => 'Annual Leave',
        ]);

        $data = [
            'code' => 'LV-002',
            'name' => 'Sick Leave',
            'leave_category' => 'unpaid',
            'description' => 'Paid sick leave',
        ];

        $response = $this->patch(route('leave-types.update', $leaveType), $data);

        $response->assertRedirect(route('leave-types.index'));
        $this->assertDatabaseHas('leave_types', array_merge($data, ['id' => $leaveType->id]));
    }

    public function test_update_validates_unique_code_excluding_current(): void
    {
        $leaveType = LeaveType::factory()->create(['code' => 'LV-001']);
        LeaveType::factory()->create(['code' => 'LV-002']);

        $response = $this->patch(route('leave-types.update', $leaveType), [
            'code' => 'LV-002',
            'name' => 'Annual Leave',
            'leave_category' => 'paid',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_destroy_deletes_leave_type(): void
    {
        $leaveType = LeaveType::factory()->create();

        $response = $this->delete(route('leave-types.destroy', $leaveType));

        $response->assertRedirect(route('leave-types.index'));
        $this->assertDatabaseMissing('leave_types', ['id' => $leaveType->id]);
    }

    public function test_leave_types_require_authentication(): void
    {
        $this->post(route('logout'));

        $this->get(route('leave-types.index'))->assertRedirect();
        $this->get(route('leave-types.create'))->assertRedirect();
        $this->post(route('leave-types.store'), [])->assertRedirect();
    }
}
