<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\EmployeeAssistantConversation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmployeeAssistantConversation>
 */
class EmployeeAssistantConversationFactory extends Factory
{
    protected $model = EmployeeAssistantConversation::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'title' => fake()->optional()->sentence(3),
        ];
    }
}
