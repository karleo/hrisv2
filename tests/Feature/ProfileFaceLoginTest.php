<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileFaceLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ValidateCsrfToken::class);
        config()->set('face-login.enabled', false);
    }

    private function faceUpload(string $filename): UploadedFile
    {
        $seed = UploadedFile::fake()->image('seed.jpg', 80, 80);
        $source = $seed->getRealPath();
        $this->assertNotFalse($source);
        $bytes = (string) file_get_contents($source);

        $tmp = tempnam(sys_get_temp_dir(), 'pfl');
        $this->assertNotFalse($tmp);
        file_put_contents($tmp, $bytes);

        return new UploadedFile($tmp, $filename, 'image/jpeg', null, true);
    }

    public function test_profile_face_login_routes_are_not_available(): void
    {
        $user = User::factory()->create();
        Employee::factory()->create([
            'user_id' => $user->id,
        ]);

        $this->actingAs($user)->post('/my-profile/face-login', [
            'face_capture_front' => $this->faceUpload('front.jpg'),
            'face_capture_left' => $this->faceUpload('left.jpg'),
            'face_capture_right' => $this->faceUpload('right.jpg'),
        ])->assertNotFound();

        $this->actingAs($user)->delete('/my-profile/face-login')
            ->assertNotFound();
    }

    public function test_admin_can_disable_face_login_from_users_edit_action(): void
    {
        Storage::fake('local');

        $adminRole = Role::query()->where('slug', 'administrator')->first();
        $this->assertNotNull($adminRole);
        $admin = User::factory()->create([
            'role_id' => $adminRole->id,
        ]);
        $target = User::factory()->create([
            'face_profile' => [
                'front' => 'face-references/99/front.jpg',
                'left' => 'face-references/99/left.jpg',
                'right' => 'face-references/99/right.jpg',
            ],
            'face_enrolled_at' => now(),
            'face_provider' => 'local',
        ]);

        $this->actingAs($admin)->delete("/users/{$target->id}/face-login")
            ->assertRedirect("/users/{$target->id}/edit");

        $target->refresh();
        $this->assertNull($target->face_enrolled_at);
        $this->assertNull($target->face_profile);
        $this->assertNull($target->face_provider);
    }
}
