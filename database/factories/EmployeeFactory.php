<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use App\Models\WorkTimetable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = Employee::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employee_code' => strtoupper(fake()->unique()->bothify('EMP-####')),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email_address' => fake()->unique()->safeEmail(),
            'contact_number' => fake()->optional(0.8)->phoneNumber(),
            'address_1' => fake()->optional(0.9)->streetAddress(),
            'address_2' => fake()->optional(0.3)->secondaryAddress(),
            'department_id' => Department::factory(),
            'job_position_id' => JobPosition::factory(),
            'work_timetable_id' => WorkTimetable::factory(),
            'employee_status' => 'Employed',
        ];
    }
}
