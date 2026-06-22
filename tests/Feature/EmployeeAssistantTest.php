<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\EmployeeAssistantConversation;
use App\Models\EmployeeAssistantMessage;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Services\EmployeeAssistant\EmployeeContextBuilder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EmployeeAssistantTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->withoutVite();
    }

    private function linkedEmployee(?User $user = null, array $employeeAttributes = []): Employee
    {
        $user ??= User::factory()->create();

        return Employee::factory()->create([
            ...$employeeAttributes,
            'user_id' => $user->id,
        ]);
    }

    private function enableAssistant(): void
    {
        config([
            'ai-assistant.enabled' => true,
            'ai-assistant.openai.api_key' => 'test-key',
            'ai-assistant.openai.model' => 'gpt-4o-mini',
            'ai-assistant.openai.base_url' => 'https://api.openai.com/v1',
        ]);
    }

    public function test_guest_is_redirected_from_employee_assistant(): void
    {
        $this->get(route('employee-assistant.index'))
            ->assertRedirect(route('login'));
    }

    public function test_unlinked_user_cannot_access_employee_assistant(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('employee-assistant.index'))
            ->assertForbidden();
    }

    public function test_linked_employee_can_load_employee_assistant_page(): void
    {
        $user = User::factory()->create();
        $this->linkedEmployee($user);

        $this->actingAs($user)
            ->get(route('employee-assistant.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('employee-assistant/index')
                ->where('assistantEnabled', true)
                ->has('assistantConfigured')
                ->has('conversations')
                ->has('messages'));
    }

    public function test_store_message_persists_conversation_and_returns_assistant_reply(): void
    {
        $this->enableAssistant();

        Http::fake([
            'api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Your remaining leave balance is 12 days.',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $employee = $this->linkedEmployee($user, ['leave_opening_balance' => 15]);

        LeaveType::factory()->create([
            'code' => 'AL',
            'name' => 'Annual Leave',
            'leave_category' => 'paid',
        ]);

        LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $employee->department_id,
            'status' => 'approved',
            'absence_types' => ['Annual Leave'],
            'days' => 3,
            'decided_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->postJson(route('employee-assistant.messages.store'), [
                'content' => 'What is my leave balance?',
            ]);

        $response->assertCreated()
            ->assertJsonPath('assistant_message.content', 'Your remaining leave balance is 12 days.');

        $conversationId = (int) $response->json('conversation.id');

        $this->assertDatabaseHas('employee_assistant_conversations', [
            'id' => $conversationId,
            'employee_id' => $employee->id,
            'title' => 'What is my leave balance?',
        ]);

        $this->assertDatabaseHas('employee_assistant_messages', [
            'conversation_id' => $conversationId,
            'role' => 'user',
            'content' => 'What is my leave balance?',
        ]);

        $this->assertDatabaseHas('employee_assistant_messages', [
            'conversation_id' => $conversationId,
            'role' => 'assistant',
            'content' => 'Your remaining leave balance is 12 days.',
        ]);
    }

    public function test_openai_quota_error_returns_helpful_message_and_rolls_back_user_message(): void
    {
        $this->enableAssistant();

        Http::fake([
            'api.openai.com/v1/chat/completions' => Http::response([
                'error' => [
                    'message' => 'You exceeded your current quota, please check your plan and billing details.',
                ],
            ], 429),
        ]);

        $user = User::factory()->create();
        $this->linkedEmployee($user);

        $this->actingAs($user)
            ->postJson(route('employee-assistant.messages.store'), [
                'content' => 'Hello',
            ])
            ->assertStatus(422)
            ->assertJsonPath(
                'message',
                'The assistant is temporarily unavailable because the OpenAI account has no remaining quota. Please contact HR or IT support.',
            );

        $this->assertDatabaseCount('employee_assistant_messages', 0);
        $this->assertDatabaseCount('employee_assistant_conversations', 0);
    }

    public function test_context_builder_only_includes_own_employee_data(): void
    {
        LeaveType::factory()->create([
            'code' => 'AL',
            'name' => 'Annual Leave',
            'leave_category' => 'paid',
        ]);

        $employee = Employee::factory()->create(['leave_opening_balance' => 20]);
        $otherEmployee = Employee::factory()->create(['leave_opening_balance' => 99]);

        LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $employee->department_id,
            'status' => 'approved',
            'absence_types' => ['Annual Leave'],
            'days' => 2,
            'decided_at' => now(),
        ]);

        LeaveRequest::factory()->create([
            'employee_id' => $otherEmployee->id,
            'department_id' => $otherEmployee->department_id,
            'status' => 'approved',
            'absence_types' => ['Annual Leave'],
            'days' => 10,
            'decided_at' => now(),
        ]);

        $context = app(EmployeeContextBuilder::class)->buildForEmployee($employee);

        $this->assertSame(20.0, $context['leave']['opening_balance']);
        $this->assertSame(18.0, $context['leave']['remaining_balance']);
        $this->assertSame($employee->employee_code, $context['profile']['employee_code']);
    }

    public function test_disabled_assistant_returns_friendly_error(): void
    {
        config([
            'ai-assistant.enabled' => false,
            'ai-assistant.openai.api_key' => 'test-key',
        ]);

        $user = User::factory()->create();
        $this->linkedEmployee($user);

        $this->actingAs($user)
            ->postJson(route('employee-assistant.messages.store'), [
                'content' => 'Hello',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'The employee assistant is currently disabled.');
    }

    public function test_missing_api_key_returns_friendly_error(): void
    {
        config([
            'ai-assistant.enabled' => true,
            'ai-assistant.openai.api_key' => '',
        ]);

        $user = User::factory()->create();
        $this->linkedEmployee($user);

        $this->actingAs($user)
            ->postJson(route('employee-assistant.messages.store'), [
                'content' => 'Hello',
            ])
            ->assertStatus(422)
            ->assertJsonPath(
                'message',
                'The employee assistant is not configured. Please contact HR or IT support.',
            );
    }

    public function test_employee_can_delete_own_conversation(): void
    {
        $user = User::factory()->create();
        $employee = $this->linkedEmployee($user);

        $conversation = EmployeeAssistantConversation::factory()->create([
            'employee_id' => $employee->id,
        ]);

        EmployeeAssistantMessage::factory()->create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => 'Test',
        ]);

        $this->actingAs($user)
            ->deleteJson(route('employee-assistant.conversations.destroy', $conversation))
            ->assertOk()
            ->assertJson(['deleted' => true]);

        $this->assertDatabaseMissing('employee_assistant_conversations', [
            'id' => $conversation->id,
        ]);
    }

    public function test_employee_cannot_delete_another_employees_conversation(): void
    {
        $user = User::factory()->create();
        $this->linkedEmployee($user);

        $otherConversation = EmployeeAssistantConversation::factory()->create();

        $this->actingAs($user)
            ->deleteJson(route('employee-assistant.conversations.destroy', $otherConversation))
            ->assertNotFound();
    }

    public function test_store_message_is_rate_limited(): void
    {
        $this->enableAssistant();

        Http::fake([
            'api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    ['message' => ['content' => 'OK']],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $this->linkedEmployee($user);

        for ($index = 0; $index < 20; $index++) {
            $this->actingAs($user)
                ->postJson(route('employee-assistant.messages.store'), [
                    'content' => "Message {$index}",
                ])
                ->assertCreated();
        }

        $this->actingAs($user)
            ->postJson(route('employee-assistant.messages.store'), [
                'content' => 'One more message',
            ])
            ->assertStatus(429);
    }
}
