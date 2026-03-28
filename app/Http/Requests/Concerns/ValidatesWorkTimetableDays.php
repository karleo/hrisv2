<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

trait ValidatesWorkTimetableDays
{
    /**
     * @return array<string, mixed>
     */
    protected function workTimetableDayRules(): array
    {
        return [
            'schedule_days' => ['required', 'array', 'size:7'],
            'schedule_days.*.weekday' => ['required', 'integer', Rule::in([1, 2, 3, 4, 5, 6, 7])],
            'schedule_days.*.is_rest_day' => ['required', 'boolean'],
            'schedule_days.*.work_starts_at' => ['nullable', 'string', 'max:8'],
            'schedule_days.*.work_ends_at' => ['nullable', 'string', 'max:8'],
        ];
    }

    public function withWorkTimetableDaysValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $days = $this->input('schedule_days', []);
            if (! is_array($days) || count($days) !== 7) {
                return;
            }

            $weekdays = collect($days)->pluck('weekday')->filter(fn ($v) => $v !== null && $v !== '')->values();
            if ($weekdays->unique()->count() !== 7) {
                $validator->errors()->add(
                    'schedule_days',
                    'Each weekday from 1 (Monday) through 7 (Sunday) must appear exactly once.'
                );

                return;
            }

            foreach ($days as $index => $day) {
                if (! is_array($day)) {
                    continue;
                }

                $isRest = filter_var($day['is_rest_day'] ?? false, FILTER_VALIDATE_BOOLEAN);
                if ($isRest) {
                    continue;
                }

                $start = $day['work_starts_at'] ?? null;
                $end = $day['work_ends_at'] ?? null;
                if ($start === null || $start === '' || $end === null || $end === '') {
                    $validator->errors()->add(
                        "schedule_days.{$index}.work_starts_at",
                        'Start and end times are required on working days.'
                    );

                    continue;
                }

                if (
                    ! preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string) $start)
                    || ! preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string) $end)
                ) {
                    $validator->errors()->add(
                        "schedule_days.{$index}.work_starts_at",
                        'Use 24-hour time in HH:MM format.'
                    );

                    continue;
                }

                $startMin = $this->scheduleTimeToMinutes((string) $start);
                $endMin = $this->scheduleTimeToMinutes((string) $end);
                if ($endMin <= $startMin) {
                    $validator->errors()->add(
                        "schedule_days.{$index}.work_ends_at",
                        'End time must be after start time.'
                    );
                }
            }
        });
    }

    private function scheduleTimeToMinutes(string $time): int
    {
        $parts = explode(':', $time);
        $h = (int) ($parts[0] ?? 0);
        $m = (int) ($parts[1] ?? 0);

        return $h * 60 + $m;
    }
}
