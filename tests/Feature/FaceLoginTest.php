<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FaceLoginTest extends TestCase
{
    use RefreshDatabase;

    private static ?string $canonicalFaceBytes = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    private function canonicalFaceBytes(): string
    {
        if (self::$canonicalFaceBytes === null) {
            $f = UploadedFile::fake()->image('seed.jpg', 32, 32);
            $path = $f->getRealPath();
            self::$canonicalFaceBytes = $path !== false ? (string) file_get_contents($path) : '';
        }

        return self::$canonicalFaceBytes;
    }

    private function faceUpload(string $filename = 'face.jpg'): UploadedFile
    {
        $tmp = tempnam(sys_get_temp_dir(), 'fc');
        $this->assertNotFalse($tmp);
        file_put_contents($tmp, $this->canonicalFaceBytes());

        return new UploadedFile($tmp, $filename, 'image/jpeg', null, true);
    }

    /**
     * @return array<string, string>
     */
    private function seedMultiAngleProfile(User $user, string $bytes): array
    {
        $base = 'face-references/'.$user->id;
        $paths = [
            'front' => $base.'/front.jpg',
            'left' => $base.'/left.jpg',
            'right' => $base.'/right.jpg',
        ];
        foreach ($paths as $path) {
            Storage::disk('local')->put($path, $bytes);
        }

        return $paths;
    }

    public function test_login_succeeds_with_matching_face_when_enrolled(): void
    {
        $bytes = $this->canonicalFaceBytes();
        $this->assertNotSame('', $bytes);

        $user = User::factory()->create([
            'password' => Hash::make('Password123!'),
        ]);

        $paths = $this->seedMultiAngleProfile($user, $bytes);
        $user->forceFill([
            'face_profile' => $paths,
            'face_reference_path' => null,
            'face_enrolled_at' => now(),
            'face_provider' => 'local',
        ])->save();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'Password123!',
            'face_capture' => $this->faceUpload(),
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_succeeds_with_face_only_placeholder_password_when_enrolled(): void
    {
        $bytes = $this->canonicalFaceBytes();
        $this->assertNotSame('', $bytes);

        $user = User::factory()->create([
            'password' => Hash::make('Password123!'),
        ]);

        $paths = $this->seedMultiAngleProfile($user, $bytes);
        $user->forceFill([
            'face_profile' => $paths,
            'face_reference_path' => null,
            'face_enrolled_at' => now(),
            'face_provider' => 'local',
        ])->save();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'face-only-login',
            'face_capture' => $this->faceUpload(),
        ])->assertSessionHasNoErrors();

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_fails_with_face_only_placeholder_email_when_enrolled(): void
    {
        $bytes = $this->canonicalFaceBytes();
        $this->assertNotSame('', $bytes);

        $user = User::factory()->create([
            'password' => Hash::make('Password123!'),
        ]);

        $paths = $this->seedMultiAngleProfile($user, $bytes);
        $user->forceFill([
            'face_profile' => $paths,
            'face_reference_path' => null,
            'face_enrolled_at' => now(),
            'face_provider' => 'local',
        ])->save();

        $this->from('/login')->post('/login', [
            'email' => '__face_only_login__',
            'password' => 'face-only-login',
            'face_capture' => $this->faceUpload(),
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_login_fails_with_wrong_face_when_enrolled(): void
    {
        $bytes = $this->canonicalFaceBytes();
        $user = User::factory()->create([
            'password' => Hash::make('Password123!'),
        ]);
        $paths = $this->seedMultiAngleProfile($user, $bytes);
        $user->forceFill([
            'face_profile' => $paths,
            'face_reference_path' => null,
            'face_enrolled_at' => now(),
            'face_provider' => 'local',
        ])->save();

        $wrong = UploadedFile::fake()->image('other.jpg', 80, 80);

        $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'Password123!',
            'face_capture' => $wrong,
        ])->assertSessionHasErrors([
            'face_capture' => 'Face does not match this email account.',
        ]);

        $this->assertGuest();
    }

    public function test_login_fails_when_local_mode_is_insecure(): void
    {
        config()->set('face-login.driver', 'local');
        config()->set('face-login.local_mode', 'insecure');

        $bytes = $this->canonicalFaceBytes();
        $user = User::factory()->create([
            'password' => Hash::make('Password123!'),
        ]);
        $paths = $this->seedMultiAngleProfile($user, $bytes);
        $user->forceFill([
            'face_profile' => $paths,
            'face_reference_path' => null,
            'face_enrolled_at' => now(),
            'face_provider' => 'local',
        ])->save();

        $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'face-only-login',
            'face_capture' => $this->faceUpload(),
        ])->assertSessionHasErrors('face_capture');

        $this->assertGuest();
    }

    public function test_login_fails_without_face_when_enrolled(): void
    {
        $bytes = $this->canonicalFaceBytes();
        $user = User::factory()->create([
            'password' => Hash::make('Password123!'),
        ]);
        $paths = $this->seedMultiAngleProfile($user, $bytes);
        $user->forceFill([
            'face_profile' => $paths,
            'face_reference_path' => null,
            'face_enrolled_at' => now(),
        ])->save();

        $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'Password123!',
        ])->assertSessionHasErrors('face_capture');

        $this->assertGuest();
    }

    public function test_login_without_face_succeeds_when_user_not_enrolled(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('Password123!'),
            'face_enrolled_at' => null,
            'face_reference_path' => null,
            'face_profile' => null,
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'Password123!',
        ])->assertSessionHasNoErrors()->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_fails_for_non_enrolled_user_with_face_only_placeholder_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('Password123!'),
            'face_enrolled_at' => null,
            'face_reference_path' => null,
            'face_profile' => null,
        ]);

        $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'face-only-login',
            'face_capture' => $this->faceUpload(),
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_login_fails_with_face_only_placeholder_email_when_no_face_capture_is_provided(): void
    {
        $this->from('/login')->post('/login', [
            'email' => '__face_only_login__',
            'password' => 'face-only-login',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_login_fails_with_empty_email_when_face_capture_is_provided(): void
    {
        $this->from('/login')->post('/login', [
            'email' => '',
            'password' => 'face-only-login',
            'face_capture' => $this->faceUpload(),
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_login_succeeds_with_legacy_single_reference_path(): void
    {
        $bytes = $this->canonicalFaceBytes();
        $user = User::factory()->create([
            'password' => Hash::make('Password123!'),
        ]);
        $path = 'face-references/'.$user->id.'.jpg';
        Storage::disk('local')->put($path, $bytes);
        $user->forceFill([
            'face_reference_path' => $path,
            'face_profile' => null,
            'face_enrolled_at' => now(),
            'face_provider' => 'local',
        ])->save();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'Password123!',
            'face_capture' => $this->faceUpload(),
        ])->assertSessionHasNoErrors();

        $this->assertAuthenticatedAs($user);
    }
}
