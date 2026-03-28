<?php

namespace Tests\Unit;

use App\Enums\AttendanceCheckInStatus;
use App\Enums\AttendanceCheckOutStatus;
use App\Models\WorkTimetableDay;
use App\Services\AttendanceClassificationService;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AttendanceClassificationServiceTest extends TestCase
{
    #[Test]
    public function it_classifies_using_app_timezone_not_utc_wall_clock(): void
    {
        config(['app.timezone' => 'Asia/Manila']);
        config(['attendance.grace_minutes' => 5]);

        $day = WorkTimetableDay::make([
            'weekday' => 6,
            'is_rest_day' => false,
            'work_starts_at' => '16:53:00',
            'work_ends_at' => '16:57:00',
        ]);

        $service = new AttendanceClassificationService;

        // 09:12 UTC = 17:12 in Manila — after 16:53 start (late), after 16:57 end (overtime).
        $clockInUtc = Carbon::parse('2026-03-28 09:12:17', 'UTC');
        $clockOutUtc = Carbon::parse('2026-03-28 09:12:20', 'UTC');

        $this->assertSame(
            AttendanceCheckInStatus::Late,
            $service->classifyCheckIn($clockInUtc, $day),
        );
        $this->assertSame(
            AttendanceCheckOutStatus::Overtime,
            $service->classifyCheckOut($clockOutUtc, $day),
        );
    }
}
