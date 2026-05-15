<?php

namespace Database\Seeders;

use App\Models\WorkTimetable;
use Illuminate\Database\Seeder;

class WorkTimetableSeeder extends Seeder
{
    public function run(): void
    {
        $schedules = [
            [
                'name' => 'Standard Office (Sun–Thu 9–5)',
                'days' => [
                    1 => ['09:00:00', '17:00:00', false],
                    2 => ['09:00:00', '17:00:00', false],
                    3 => ['09:00:00', '17:00:00', false],
                    4 => ['09:00:00', '17:00:00', false],
                    5 => ['09:00:00', '17:00:00', false],
                    6 => [null, null, true],
                    7 => [null, null, true],
                ],
            ],
            [
                'name' => 'Operations (Sat–Wed 8–4)',
                'days' => [
                    1 => [null, null, true],
                    2 => [null, null, true],
                    3 => [null, null, true],
                    4 => [null, null, true],
                    5 => [null, null, true],
                    6 => ['08:00:00', '16:00:00', false],
                    7 => ['08:00:00', '16:00:00', false],
                ],
            ],
            [
                'name' => 'Flexible (Mon–Fri 10–6)',
                'days' => [
                    1 => ['10:00:00', '18:00:00', false],
                    2 => ['10:00:00', '18:00:00', false],
                    3 => ['10:00:00', '18:00:00', false],
                    4 => ['10:00:00', '18:00:00', false],
                    5 => ['10:00:00', '18:00:00', false],
                    6 => [null, null, true],
                    7 => [null, null, true],
                ],
            ],
        ];

        foreach ($schedules as $schedule) {
            $timetable = WorkTimetable::query()->updateOrCreate(
                ['name' => $schedule['name']],
                ['name' => $schedule['name']],
            );

            foreach ($schedule['days'] as $weekday => [$start, $end, $isRest]) {
                $timetable->days()->updateOrCreate(
                    ['weekday' => $weekday],
                    [
                        'is_rest_day' => $isRest,
                        'work_starts_at' => $start,
                        'work_ends_at' => $end,
                    ],
                );
            }
        }
    }
}
