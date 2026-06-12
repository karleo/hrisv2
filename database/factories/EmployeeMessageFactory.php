<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\EmployeeConversation;
use App\Models\EmployeeMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmployeeMessage>
 */
class EmployeeMessageFactory extends Factory
{
    protected $model = EmployeeMessage::class;

    public function definition(): array
    {
        return [
            'conversation_id' => EmployeeConversation::factory(),
            'sender_employee_id' => Employee::factory(),
            'recipient_employee_id' => Employee::factory(),
            'body' => fake()->sentence(),
            'read_at' => null,
        ];
    }
}
