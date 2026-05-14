<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeConversation;
use App\Models\EmployeeMessage;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EmployeeMessagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    private function linkedEmployee(?User $user = null, array $employeeAttributes = []): Employee
    {
        $user ??= User::factory()->create();

        return Employee::factory()->create([
            ...$employeeAttributes,
            'user_id' => $user->id,
        ]);
    }

    public function test_unlinked_user_cannot_access_employee_messages(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('employee-messages.index'))
            ->assertForbidden();
    }

    public function test_inactive_user_does_not_receive_employee_messages_shared_prop(): void
    {
        $user = User::factory()->create(['is_active' => false]);
        Employee::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->missing('employeeMessages'));
    }

    public function test_user_without_employee_profile_does_not_receive_employee_messages_shared_prop(): void
    {
        $user = User::factory()->create(['is_active' => true]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->missing('employeeMessages'));
    }

    public function test_employee_search_returns_only_active_linked_employees(): void
    {
        $currentUser = User::factory()->create();
        $this->linkedEmployee($currentUser);

        $department = Department::factory()->create(['name' => 'Operations']);
        $linked = $this->linkedEmployee(employeeAttributes: [
            'first_name' => 'Sara',
            'last_name' => 'Mansoor',
            'department_id' => $department->id,
        ]);
        $this->linkedEmployee(User::factory()->create(['is_active' => false]), [
            'first_name' => 'Inactive',
            'last_name' => 'Employee',
        ]);
        Employee::factory()->create([
            'first_name' => 'Unlinked',
            'last_name' => 'Employee',
        ]);

        $response = $this->actingAs($currentUser)
            ->getJson(route('employee-messages.search', ['q' => 'Sara']));

        $response
            ->assertOk()
            ->assertJsonPath('employees.0.id', $linked->id)
            ->assertJsonCount(1, 'employees');
    }

    public function test_employee_can_send_text_message_and_reuses_one_to_one_conversation(): void
    {
        $senderUser = User::factory()->create();
        $sender = $this->linkedEmployee($senderUser);
        $recipient = $this->linkedEmployee();

        $payload = [
            'recipient_employee_id' => $recipient->id,
            'body' => 'Hello from HRIS chat',
        ];

        $firstResponse = $this->actingAs($senderUser)
            ->postJson(route('employee-messages.store'), $payload);
        $secondResponse = $this->actingAs($senderUser)
            ->postJson(route('employee-messages.store'), [
                ...$payload,
                'body' => 'Second message',
            ]);

        $firstResponse->assertCreated();
        $secondResponse->assertCreated();

        $this->assertSame(1, EmployeeConversation::query()->count());
        $this->assertDatabaseHas('employee_messages', [
            'sender_employee_id' => $sender->id,
            'recipient_employee_id' => $recipient->id,
            'body' => 'Hello from HRIS chat',
        ]);
    }

    public function test_employee_can_send_message_with_unicode_emoji(): void
    {
        $senderUser = User::factory()->create();
        $this->linkedEmployee($senderUser);
        $recipient = $this->linkedEmployee();

        $body = 'Hello 😀 and 👍';

        $this->actingAs($senderUser)
            ->postJson(route('employee-messages.store'), [
                'recipient_employee_id' => $recipient->id,
                'body' => $body,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('employee_messages', [
            'recipient_employee_id' => $recipient->id,
            'body' => $body,
        ]);
    }

    public function test_employee_can_send_message_with_file_attachment(): void
    {
        Storage::fake('public');

        $senderUser = User::factory()->create();
        $this->linkedEmployee($senderUser);
        $recipient = $this->linkedEmployee();

        $file = UploadedFile::fake()->create('report.pdf', 100, 'application/pdf');

        $response = $this->actingAs($senderUser)
            ->post(route('employee-messages.store'), [
                'recipient_employee_id' => $recipient->id,
                'body' => 'See attached',
                'attachment' => $file,
            ], [
                'Accept' => 'application/json',
            ]);

        $response->assertCreated();

        $message = EmployeeMessage::query()->latest('id')->first();
        $this->assertNotNull($message);
        $this->assertSame('See attached', $message->body);
        $this->assertSame('report.pdf', $message->attachment_original_name);
        $this->assertIsString($message->attachment_path);
        Storage::disk('public')->assertExists($message->attachment_path);
    }

    public function test_store_requires_body_or_attachment(): void
    {
        $senderUser = User::factory()->create();
        $this->linkedEmployee($senderUser);
        $recipient = $this->linkedEmployee();

        $this->actingAs($senderUser)
            ->postJson(route('employee-messages.store'), [
                'recipient_employee_id' => $recipient->id,
                'body' => '   ',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['body']);
    }

    public function test_employee_cannot_open_conversation_they_do_not_belong_to(): void
    {
        $outsiderUser = User::factory()->create();
        $this->linkedEmployee($outsiderUser);

        $employeeOne = $this->linkedEmployee();
        $employeeTwo = $this->linkedEmployee();
        [$employeeOneId, $employeeTwoId] = EmployeeConversation::orderedEmployeePair($employeeOne->id, $employeeTwo->id);
        $conversation = EmployeeConversation::factory()->create([
            'employee_one_id' => $employeeOneId,
            'employee_two_id' => $employeeTwoId,
        ]);

        $this->actingAs($outsiderUser)
            ->getJson(route('employee-messages.conversations.show', $conversation))
            ->assertNotFound();
    }

    public function test_mark_read_updates_unread_messages(): void
    {
        $sender = $this->linkedEmployee();
        $recipientUser = User::factory()->create();
        $recipient = $this->linkedEmployee($recipientUser);
        [$employeeOneId, $employeeTwoId] = EmployeeConversation::orderedEmployeePair($sender->id, $recipient->id);
        $conversation = EmployeeConversation::factory()->create([
            'employee_one_id' => $employeeOneId,
            'employee_two_id' => $employeeTwoId,
        ]);
        $message = EmployeeMessage::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_employee_id' => $sender->id,
            'recipient_employee_id' => $recipient->id,
            'read_at' => null,
        ]);

        $this->actingAs($recipientUser)
            ->postJson(route('employee-messages.conversations.read', $conversation))
            ->assertOk()
            ->assertJsonPath('message_ids.0', $message->id);

        $this->assertNotNull($message->refresh()->read_at);
    }

    public function test_employee_messages_page_preloads_selected_conversation_and_limits_messages(): void
    {
        $employeeOneUser = User::factory()->create();
        $employeeOne = $this->linkedEmployee($employeeOneUser);
        $employeeTwo = $this->linkedEmployee();
        [$employeeOneId, $employeeTwoId] = EmployeeConversation::orderedEmployeePair($employeeOne->id, $employeeTwo->id);
        $conversation = EmployeeConversation::factory()->create([
            'employee_one_id' => $employeeOneId,
            'employee_two_id' => $employeeTwoId,
        ]);

        EmployeeMessage::factory()->count(55)->create([
            'conversation_id' => $conversation->id,
            'sender_employee_id' => $employeeTwo->id,
            'recipient_employee_id' => $employeeOne->id,
            'read_at' => null,
        ]);

        $this->actingAs($employeeOneUser)
            ->get(route('employee-messages.index', ['conversation' => $conversation->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('employee-messages/index')
                ->where('selectedConversation.id', $conversation->id)
                ->has('messages', 50)
            );
    }

    public function test_unread_count_is_aggregated_across_multiple_conversations(): void
    {
        $viewerUser = User::factory()->create();
        $viewer = $this->linkedEmployee($viewerUser);
        $otherOne = $this->linkedEmployee();
        $otherTwo = $this->linkedEmployee();

        [$pairOneA, $pairOneB] = EmployeeConversation::orderedEmployeePair($viewer->id, $otherOne->id);
        [$pairTwoA, $pairTwoB] = EmployeeConversation::orderedEmployeePair($viewer->id, $otherTwo->id);

        $conversationOne = EmployeeConversation::factory()->create([
            'employee_one_id' => $pairOneA,
            'employee_two_id' => $pairOneB,
        ]);
        $conversationTwo = EmployeeConversation::factory()->create([
            'employee_one_id' => $pairTwoA,
            'employee_two_id' => $pairTwoB,
        ]);

        EmployeeMessage::factory()->count(2)->create([
            'conversation_id' => $conversationOne->id,
            'sender_employee_id' => $otherOne->id,
            'recipient_employee_id' => $viewer->id,
            'read_at' => null,
        ]);
        EmployeeMessage::factory()->count(1)->create([
            'conversation_id' => $conversationOne->id,
            'sender_employee_id' => $otherOne->id,
            'recipient_employee_id' => $viewer->id,
            'read_at' => now(),
        ]);
        EmployeeMessage::factory()->count(3)->create([
            'conversation_id' => $conversationTwo->id,
            'sender_employee_id' => $otherTwo->id,
            'recipient_employee_id' => $viewer->id,
            'read_at' => null,
        ]);

        $this->actingAs($viewerUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('employeeMessages')
                ->where('employeeMessages.unread_count', 5)
                ->has('employeeMessages.conversations')
            );
    }

    public function test_prune_command_deletes_messages_older_than_seven_days(): void
    {
        Carbon::setTestNow('2026-05-12 12:00:00');

        $sender = $this->linkedEmployee();
        $recipient = $this->linkedEmployee();
        [$employeeOneId, $employeeTwoId] = EmployeeConversation::orderedEmployeePair($sender->id, $recipient->id);
        $conversation = EmployeeConversation::factory()->create([
            'employee_one_id' => $employeeOneId,
            'employee_two_id' => $employeeTwoId,
        ]);
        $oldMessage = EmployeeMessage::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_employee_id' => $sender->id,
            'recipient_employee_id' => $recipient->id,
            'created_at' => now()->subDays(8),
        ]);
        $newMessage = EmployeeMessage::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_employee_id' => $sender->id,
            'recipient_employee_id' => $recipient->id,
            'created_at' => now()->subDays(2),
        ]);

        $this->artisan('employee-messages:prune-old')
            ->assertSuccessful();

        $this->assertDatabaseMissing('employee_messages', ['id' => $oldMessage->id]);
        $this->assertDatabaseHas('employee_messages', ['id' => $newMessage->id]);

        Carbon::setTestNow();
    }
}
