<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BroadcastingAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_with_employee_can_authorize_presence_channel(): void
    {
        $this->withoutMiddleware(ValidateCsrfToken::class);

        $user = User::factory()->create();
        Employee::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->post('/broadcasting/auth', [
            'channel_name' => 'presence-employees.online',
            'socket_id' => '1.1',
        ]);

        $response->assertOk();
        $json = $response->json();
        $this->assertArrayHasKey('auth', $json);
        $this->assertNotEmpty($json['auth']);
    }

    public function test_guest_cannot_authorize_broadcasting_channel(): void
    {
        $this->withoutMiddleware(ValidateCsrfToken::class);

        $response = $this->post('/broadcasting/auth', [
            'channel_name' => 'presence-employees.online',
            'socket_id' => '1.1',
        ]);

        $response->assertForbidden();
    }
}
