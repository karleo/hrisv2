<?php

namespace Tests\Unit\Support;

use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use App\Support\RequestFormEmployeeSelection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RequestFormEmployeeSelectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_role_user_cannot_choose_other_employees(): void
    {
        $role = Role::query()->where('slug', 'employee')->firstOrFail();
        $user = User::factory()->create(['role_id' => $role->id]);
        $own = Employee::factory()->create(['user_id' => $user->id]);
        Employee::factory()->create();

        $selection = app(RequestFormEmployeeSelection::class);

        $this->assertFalse($selection->canChooseEmployee($user));
        $this->assertCount(1, $selection->employeesForForm($user, ['id', 'first_name', 'last_name', 'department_id']));
        $this->assertSame($own->id, $selection->employeesForForm($user, ['id'])->first()?->id);
    }

    public function test_administrator_can_choose_any_employee(): void
    {
        Employee::factory()->count(3)->create();
        $user = User::factory()->create();

        $selection = app(RequestFormEmployeeSelection::class);

        $this->assertTrue($selection->canChooseEmployee($user));
        $this->assertGreaterThanOrEqual(3, $selection->employeesForForm($user, ['id'])->count());
    }
}
