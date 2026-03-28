<?php

namespace App\Services;

use App\Enums\AttendanceCheckInStatus;
use App\Enums\AttendanceCheckOutStatus;
use App\Models\WorkTimetableDay;
use DateTimeInterface;
use Illuminate\Support\Carbon;

class AttendanceClassificationService
{
    public function classifyCheckIn(DateTimeInterface $clockIn, ?WorkTimetableDay $day): AttendanceCheckInStatus
    {
        if ($day === null || $day->is_rest_day) {
            return AttendanceCheckInStatus::NotApplicable;
        }

        $grace = max(0, (int) config('attendance.grace_minutes', 5));
        $startM = $this->timeStringToMinutes((string) $day->work_starts_at);
        $clockM = $this->minutesSinceMidnight($clockIn);
        $diff = $clockM - $startM;

        if ($diff < -$grace) {
            return AttendanceCheckInStatus::Early;
        }

        if ($diff <= $grace) {
            return AttendanceCheckInStatus::OnTime;
        }

        return AttendanceCheckInStatus::Late;
    }

    public function classifyCheckOut(DateTimeInterface $clockOut, ?WorkTimetableDay $day): AttendanceCheckOutStatus
    {
        if ($day === null || $day->is_rest_day) {
            return AttendanceCheckOutStatus::NotApplicable;
        }

        $grace = max(0, (int) config('attendance.grace_minutes', 5));
        $endM = $this->timeStringToMinutes((string) $day->work_ends_at);
        $clockM = $this->minutesSinceMidnight($clockOut);
        $diff = $clockM - $endM;

        if ($diff < -$grace) {
            return AttendanceCheckOutStatus::EarlyLeave;
        }

        if ($diff <= $grace) {
            return AttendanceCheckOutStatus::OnTime;
        }

        return AttendanceCheckOutStatus::Overtime;
    }

    /**
     * Work timetable start/end are stored as local wall-clock times for the business.
     * Clock events are stored as instants; convert to the app timezone before comparing.
     */
    private function minutesSinceMidnight(DateTimeInterface $dt): int
    {
        $local = Carbon::parse($dt)->timezone(config('app.timezone'));

        return (int) $local->format('H') * 60 + (int) $local->format('i');
    }

    private function timeStringToMinutes(string $time): int
    {
        $parts = explode(':', trim($time));
        $h = (int) ($parts[0] ?? 0);
        $m = (int) ($parts[1] ?? 0);

        return $h * 60 + $m;
    }
}
