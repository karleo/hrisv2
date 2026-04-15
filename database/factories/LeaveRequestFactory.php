<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LeaveRequest>
 */
class LeaveRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $periodFrom = fake()->dateTimeBetween('-1 month', '+1 month');
        $periodTo = (clone $periodFrom)->modify('+'.fake()->numberBetween(1, 5).' days');

        return [
            'employee_id' => Employee::factory(),
            'department_id' => Department::factory(),
            'absence_types' => ['Annual Leave'],
            'absence_other' => null,
            'details' => null,
            'date' => $periodFrom->format('Y-m-d'),
            'period_from' => $periodFrom->format('Y-m-d'),
            'start_day_type' => 'full',
            'period_to' => $periodTo->format('Y-m-d'),
            'end_day_type' => 'full',
            'days' => (float) $periodFrom->diff($periodTo)->days + 1,
            'remarks' => null,
            'status' => 'submitted',
        ];
    }
}
