<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\RequestSubmittedNotification;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    private function notify(User $user, string $requestCode): void
    {
        $user->notify(new RequestSubmittedNotification([
            'request_type' => 'EmployeeRequest',
            'request_id' => 1,
            'request_code' => $requestCode,
            'request_date' => now()->toDateString(),
            'submitted_by' => 'System',
            'route' => '/employee-requests',
            'employee_photo_url' => null,
        ]));
    }

    public function test_clear_all_notifications_deletes_only_authenticated_user_notifications(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $otherUser = User::factory()->create(['email_verified_at' => now()]);

        $this->notify($user, 'PRLER-2026-0001');
        $this->notify($user, 'PRLER-2026-0002');
        $this->notify($otherUser, 'PRLER-2026-0003');

        $response = $this->actingAs($user)->delete(route('notifications.destroy-all'));

        $response->assertRedirect();
        $this->assertSame(0, $user->fresh()->notifications()->count());
        $this->assertSame(1, $otherUser->fresh()->notifications()->count());
    }

    public function test_guest_cannot_clear_all_notifications(): void
    {
        $response = $this->delete(route('notifications.destroy-all'));

        $response->assertRedirect(route('login'));
    }
}
