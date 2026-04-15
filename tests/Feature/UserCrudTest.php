<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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

    private function validFaceCapture(): UploadedFile
    {
        return UploadedFile::fake()->image('face.jpg', 160, 160)->size(60);
    }

    /**
     * @return array<string, UploadedFile>
     */
    private function tripleFaceCaptures(): array
    {
        return [
            'face_capture_front' => $this->validFaceCapture(),
            'face_capture_left' => $this->validFaceCapture(),
            'face_capture_right' => $this->validFaceCapture(),
        ];
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

        $response = $this->post(route('users.store'), array_merge([
            'name' => 'New User',
            'email' => 'new.user@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id' => null,
            'employee_id' => $employee->id,
        ], $this->tripleFaceCaptures()));

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('users.index'));

        $user = User::query()->where('email', 'new.user@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->face_enrolled_at);
        $this->assertIsArray($user->face_profile);
        $this->assertArrayHasKey('front', $user->face_profile);
        $this->assertArrayHasKey('left', $user->face_profile);
        $this->assertArrayHasKey('right', $user->face_profile);
        foreach ($user->face_profile as $path) {
            $this->assertTrue(Storage::disk('local')->exists((string) $path));
        }
        $this->assertNull($user->face_reference_path);
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
        $this->post(route('users.store'), array_merge([
            'name' => 'Solo User',
            'email' => 'solo@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id' => null,
            'employee_id' => null,
        ], $this->tripleFaceCaptures()))->assertSessionHasNoErrors();

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
        $this->post(route('users.store'), array_merge([
            'name' => 'Dashboard User',
            'email' => 'dash.user@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id' => null,
            'employee_id' => null,
        ], $this->tripleFaceCaptures()))->assertSessionHasNoErrors();

        $user = User::query()->where('email', 'dash.user@example.com')->firstOrFail();

        $this->actingAs($user);

        $this->get(route('dashboard'))->assertOk();
    }

    public function test_create_user_rejects_common_password(): void
    {
        $this->post(route('users.store'), array_merge([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'role_id' => null,
            'employee_id' => null,
        ], $this->tripleFaceCaptures()))->assertSessionHasErrors('password');
    }

    public function test_create_user_rejects_password_containing_name_part(): void
    {
        $this->post(route('users.store'), array_merge([
            'name' => 'Alice Smith',
            'email' => 'someone@example.com',
            'password' => 'Zz9zzalicezz',
            'password_confirmation' => 'Zz9zzalicezz',
            'role_id' => null,
            'employee_id' => null,
        ], $this->tripleFaceCaptures()))->assertSessionHasErrors('password');
    }

    public function test_create_user_rejects_password_containing_email_local_part(): void
    {
        $this->post(route('users.store'), array_merge([
            'name' => 'X Y',
            'email' => 'superuser@example.com',
            'password' => 'Aa1superuserx',
            'password_confirmation' => 'Aa1superuserx',
            'role_id' => null,
            'employee_id' => null,
        ], $this->tripleFaceCaptures()))->assertSessionHasErrors('password');
    }

    public function test_create_user_requires_face_captures_for_all_angles(): void
    {
        $this->post(route('users.store'), [
            'name' => 'No Face',
            'email' => 'noface@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id' => null,
            'employee_id' => null,
        ])->assertSessionHasErrors('face_capture_front');

        $this->assertNull(User::query()->where('email', 'noface@example.com')->value('id'));
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

    public function test_update_user_can_enroll_face_profile_with_multipart_post(): void
    {
        $targetUser = User::factory()->create([
            'email_verified_at' => now(),
            'email' => 'enroll-later@example.com',
            'name' => 'Enroll Later',
            'face_enrolled_at' => null,
            'face_reference_path' => null,
            'face_profile' => null,
            'face_provider' => null,
        ]);

        $this->from(route('users.edit', $targetUser))
            ->post(route('users.update', $targetUser), array_merge([
                '_method' => 'PUT',
                'name' => 'Enroll Later',
                'email' => 'enroll-later@example.com',
                'password' => '',
                'password_confirmation' => '',
                'role_id' => null,
                'employee_id' => null,
            ], $this->tripleFaceCaptures()))
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('users.edit', $targetUser));

        $targetUser->refresh();
        $this->assertNotNull($targetUser->face_enrolled_at);
        $this->assertIsArray($targetUser->face_profile);
        $this->assertCount(3, $targetUser->face_profile);
        foreach ($targetUser->face_profile as $path) {
            $this->assertTrue(Storage::disk('local')->exists((string) $path));
        }
    }
}
