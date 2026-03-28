<?php

namespace Database\Factories;

use App\Models\WorkTimetable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkTimetable>
 */
class WorkTimetableFactory extends Factory
{
    protected $model = WorkTimetable::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true).' schedule',
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (WorkTimetable $timetable): void {
            if ($timetable->days()->exists()) {
                return;
            }

            for ($weekday = 1; $weekday <= 7; $weekday++) {
                $isRest = $weekday >= 6;
                $timetable->days()->create([
                    'weekday' => $weekday,
                    'is_rest_day' => $isRest,
                    'work_starts_at' => $isRest ? null : '09:00:00',
                    'work_ends_at' => $isRest ? null : '17:00:00',
                ]);
            }
        });
    }
}
