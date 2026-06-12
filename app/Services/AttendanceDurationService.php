<?php

namespace App\Services;

use App\Models\Employee;
use DateTimeInterface;
use Illuminate\Support\Carbon;

// Calculates worked minutes and overtime minutes for a time entry
class AttendanceDurationService
{
    /**
     * Compute the number of minutes between two timestamps.
     */
    public function workedMinutes(DateTimeInterface $clockIn, DateTimeInterface $clockOut): int
    {
        // Ceiling division so a 30-second difference counts as 1 minute
        $seconds = Carbon::parse($clockIn)->diffInSeconds(Carbon::parse($clockOut));

        if ($seconds <= 0) {
            return 0;
        }

        return (int) ceil($seconds / 60);
    }

    /**
     * Compute overtime minutes (worked beyond the scheduled end for that day).
     * Returns 0 when there is no applicable schedule or the employee worked less than expected.
     */
    public function overtimeMinutes(Employee $employee, DateTimeInterface $clockIn, int $workedMinutes): int
    {
        $day = $employee->scheduleDayFor($clockIn);

        if ($day === null || $day->is_rest_day) {
            return 0;
        }

        $expected = $day->expectedMinutes();

        // Overtime is only positive; under-time yields 0
        return max(0, $workedMinutes - $expected);
    }
}
