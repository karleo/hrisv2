<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeConversation;
use App\Models\EmployeeMessage;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
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
