<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use App\Support\EmployeePresence\EmployeePresenceOnlineData;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Support\Header;
use Tests\TestCase;

class EmployeePresenceStatusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_heartbeat_records_active_employee_in_cache(): void
    {
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->postJson(route('employee-presence.heartbeat'))
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertTrue(
            Cache::has(EmployeePresenceOnlineData::cacheKey($employee->id)),
        );
        $this->assertTrue(
            EmployeePresenceOnlineData::hasActiveHeartbeat($employee->id),
        );
        $this->assertIsInt(
            Cache::get(EmployeePresenceOnlineData::cacheKey($employee->id)),
        );
    }

    public function test_heartbeat_with_inertia_header_redirects_back(): void
    {
        $user = User::factory()->create();
        Employee::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->from(route('profile.edit'))
            ->withHeaders(['X-Inertia' => 'true'])
            ->post(route('employee-presence.heartbeat'))
            ->assertRedirect(route('profile.edit'));
    }

    public function test_shared_inertia_employee_presence_contains_heartbeated_peers(): void
    {
        $userA = User::factory()->create();
        $employeeA = Employee::factory()->create(['user_id' => $userA->id]);

        $userB = User::factory()->create(['email_verified_at' => now()]);
        Employee::factory()->create(['user_id' => $userB->id]);

        $this->actingAs($userA)
            ->postJson(route('employee-presence.heartbeat'))
            ->assertOk();

        $this->actingAs($userB)
            ->get(route('profile.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('employeePresence')
                ->where(
                    'employeePresence.employee_ids',
                    fn ($ids) => is_array($ids) && in_array($employeeA->id, $ids, true),
                ));
    }

    public function test_index_lists_heartbeated_employees_for_another_user(): void
    {
        $userA = User::factory()->create();
        $employeeA = Employee::factory()->create(['user_id' => $userA->id]);

        $userB = User::factory()->create();
        $employeeB = Employee::factory()->create(['user_id' => $userB->id]);

        $this->actingAs($userA)
            ->postJson(route('employee-presence.heartbeat'))
            ->assertOk();

        $response = $this->actingAs($userB)
            ->getJson(route('employee-presence.index'));

        $response->assertOk();
        $ids = $response->json('employee_ids');
        $this->assertIsArray($ids);
        $this->assertContains($employeeA->id, $ids);
        $this->assertCount(1, $ids);
        $this->assertSame($employeeA->id, $response->json('employees.0.id'));
    }

    public function test_guest_cannot_heartbeat_or_list_presence(): void
    {
        $this->postJson(route('employee-presence.heartbeat'))
            ->assertForbidden();

        $this->getJson(route('employee-presence.index'))
            ->assertForbidden();
    }

    public function test_partial_inertia_visit_still_includes_employee_presence_with_only_conversations(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Employee::factory()->create(['user_id' => $user->id]);

        $version = Inertia::getVersion();

        $response = $this->actingAs($user)
            ->withHeaders([
                Header::INERTIA => 'true',
                Header::VERSION => $version,
                Header::PARTIAL_COMPONENT => 'employee-messages/index',
                Header::PARTIAL_ONLY => 'conversations',
            ])
            ->get(route('employee-messages.index'));

        $response->assertOk();
        $page = $response->json();
        $this->assertIsArray($page);
        $this->assertArrayHasKey('props', $page);
        $this->assertArrayHasKey('employeePresence', $page['props']);
        $this->assertArrayHasKey('conversations', $page['props']);
        $this->assertArrayHasKey('employee_ids', $page['props']['employeePresence']);
        $this->assertArrayHasKey('viewerEmployeeId', $page['props']);
        $user->load('employee');
        $this->assertInstanceOf(Employee::class, $user->employee);
        $this->assertSame($user->employee->id, $page['props']['viewerEmployeeId']);
    }
}
