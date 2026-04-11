<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs(User::factory()->create(['email_verified_at' => now()]));
    }

    public function test_users_index_requires_user_management_access(): void
    {
        $limited = Role::factory()->create(['name' => 'No users', 'slug' => 'no-users']);
        $actor = User::factory()->create([
            'email_verified_at' => now(),
            'role_id' => $limited->id,
        ]);

        $this->actingAs($actor);

        $this->get(route('users.index'))->assertForbidden();
    }

    public function test_administrator_can_create_user_with_optional_employee(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'user_id' => null,
        ]);

        $response = $this->post(route('users.store'), [
            'name' => 'New User',
            'email' => 'new.user@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id' => null,
            'employee_id' => $employee->id,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('users.index'));

        $user = User::query()->where('email', 'new.user@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue(Hash::check('Password123!', $user->password));
        $this->assertSame(
            Role::query()->where('slug', 'basic')->value('id'),
            $user->role_id,
        );

        $employee->refresh();
        $this->assertSame($user->id, $employee->user_id);
    }

    public function test_administrator_can_create_user_without_employee(): void
    {
        $this->post(route('users.store'), [
            'name' => 'Solo User',
            'email' => 'solo@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id' => null,
            'employee_id' => null,
        ])->assertSessionHasNoErrors();

        $user = User::query()->where('email', 'solo@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNull($user->employee);
        $this->assertSame(
            Role::query()->where('slug', 'basic')->value('id'),
            $user->role_id,
        );
    }

    public function test_user_created_without_role_can_open_dashboard_after_login(): void
    {
        $this->post(route('users.store'), [
            'name' => 'Dashboard User',
            'email' => 'dash.user@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id' => null,
            'employee_id' => null,
        ])->assertSessionHasNoErrors();

        $user = User::query()->where('email', 'dash.user@example.com')->firstOrFail();

        $this->actingAs($user);

        $this->get(route('dashboard'))->assertOk();
    }

    public function test_create_user_rejects_common_password(): void
    {
        $this->post(route('users.store'), [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'role_id' => null,
            'employee_id' => null,
        ])->assertSessionHasErrors('password');
    }

    public function test_create_user_rejects_password_containing_name_part(): void
    {
        $this->post(route('users.store'), [
            'name' => 'Alice Smith',
            'email' => 'someone@example.com',
            'password' => 'Zz9zzalicezz',
            'password_confirmation' => 'Zz9zzalicezz',
            'role_id' => null,
            'employee_id' => null,
        ])->assertSessionHasErrors('password');
    }

    public function test_create_user_rejects_password_containing_email_local_part(): void
    {
        $this->post(route('users.store'), [
            'name' => 'X Y',
            'email' => 'superuser@example.com',
            'password' => 'Aa1superuserx',
            'password_confirmation' => 'Aa1superuserx',
            'role_id' => null,
            'employee_id' => null,
        ])->assertSessionHasErrors('password');
    }

    public function test_user_cannot_delete_self(): void
    {
        $actor = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($actor);

        $response = $this->delete(route('users.destroy', $actor));

        $response->assertSessionHasErrors('user');
        $this->assertDatabaseHas('users', ['id' => $actor->id]);
    }

    public function test_update_user_shows_validation_errors_for_invalid_payload(): void
    {
        $targetUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->from(route('users.edit', $targetUser))
            ->put(route('users.update', $targetUser), [
                'name' => '',
                'email' => 'not-valid-email',
                'password' => '',
                'password_confirmation' => '',
                'role_id' => null,
                'employee_id' => null,
            ])
            ->assertRedirect(route('users.edit', $targetUser))
            ->assertSessionHasErrors(['name', 'email']);
    }

    public function test_update_user_persists_employee_link(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();

        $targetUser = User::factory()->create([
            'email_verified_at' => now(),
            'email' => 'linkme@example.com',
            'name' => 'Link Me',
        ]);

        $employee = Employee::factory()->create([
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'user_id' => null,
        ]);

        $this->from(route('users.edit', $targetUser))
            ->put(route('users.update', $targetUser), [
                'name' => 'Link Me',
                'email' => 'linkme@example.com',
                'password' => '',
                'password_confirmation' => '',
                'role_id' => null,
                'employee_id' => $employee->id,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('users.edit', $targetUser));

        $employee->refresh();
        $this->assertSame($targetUser->id, $employee->user_id);

        $targetUser->refresh();
        $targetUser->load([
            'employee:id,user_id,employee_code,first_name,last_name',
        ]);
        $this->assertNotNull($targetUser->employee);
        $this->assertSame($employee->id, $targetUser->employee->id);
    }

    public function test_administrator_can_update_user_linked_employee(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();

        $targetUser = User::factory()->create([
            'email_verified_at' => now(),
            'email' => 'cali@example.com',
        ]);

        $employeeA = Employee::factory()->create([
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'user_id' => $targetUser->id,
        ]);

        $employeeB = Employee::factory()->create([
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'user_id' => null,
        ]);

        $response = $this->put(route('users.update', $targetUser), [
            'name' => 'Cali',
            'email' => 'cali@example.com',
            'password' => '',
            'password_confirmation' => '',
            'role_id' => null,
            'employee_id' => $employeeB->id,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('users.edit', $targetUser));

        $employeeA->refresh();
        $employeeB->refresh();
        $this->assertNull($employeeA->user_id);
        $this->assertSame($targetUser->id, $employeeB->user_id);
    }
}
