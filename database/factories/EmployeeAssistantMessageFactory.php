<?php

namespace Database\Factories;

use App\Models\EmployeeAssistantConversation;
use App\Models\EmployeeAssistantMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmployeeAssistantMessage>
 */
class EmployeeAssistantMessageFactory extends Factory
{
    protected $model = EmployeeAssistantMessage::class;

    public function definition(): array
    {
        return [
            'conversation_id' => EmployeeAssistantConversation::factory(),
            'role' => fake()->randomElement(['user', 'assistant']),
            'content' => fake()->paragraph(),
        ];
    }
}
