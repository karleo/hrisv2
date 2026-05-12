<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\EmployeeConversation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmployeeConversation>
 */
class EmployeeConversationFactory extends Factory
{
    protected $model = EmployeeConversation::class;

    public function definition(): array
    {
        $employeeOne = Employee::factory();
        $employeeTwo = Employee::factory();

        return [
            'employee_one_id' => $employeeOne,
            'employee_two_id' => $employeeTwo,
            'last_message_id' => null,
            'last_message_at' => null,
        ];
    }
}
