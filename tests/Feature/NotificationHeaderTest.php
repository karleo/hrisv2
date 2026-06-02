<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Tests\TestCase;

class NotificationHeaderTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifications_header_returns_json_for_authenticated_user(): void
    {
        $user = User::factory()->create();

        DatabaseNotification::query()->create([
            'id' => '00000000-0000-0000-0000-000000000001',
            'type' => 'App\\Notifications\\RequestSubmittedNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => ['request_code' => 'LR-001'],
            'read_at' => null,
        ]);

        $this->actingAs($user)
            ->getJson(route('notifications.header'))
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonCount(1, 'items');
    }

    public function test_notifications_header_requires_authentication(): void
    {
        $this->getJson(route('notifications.header'))
            ->assertUnauthorized();
    }
}
