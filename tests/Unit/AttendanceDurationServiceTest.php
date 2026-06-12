<?php

namespace Tests\Unit;

use App\Models\Employee;
use App\Models\WorkTimetable;
use App\Models\WorkTimetableDay;
use App\Services\AttendanceDurationService;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AttendanceDurationServiceTest extends TestCase
{
    private AttendanceDurationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new AttendanceDurationService;
    }

    #[Test]
    public function it_computes_worked_minutes_with_ceiling_rounding(): void
    {
        // 30 seconds over 8 hours should round up to 1 extra minute
        $clockIn = Carbon::parse('2026-06-12 08:00:00');
        $clockOut = Carbon::parse('2026-06-12 16:00:30');

        $this->assertSame(481, $this->service->workedMinutes($clockIn, $clockOut));
    }

    #[Test]
    public function it_returns_zero_worked_minutes_when_times_are_equal(): void
    {
        $time = Carbon::parse('2026-06-12 08:00:00');

        $this->assertSame(0, $this->service->workedMinutes($time, $time));
    }

    #[Test]
    public function it_computes_overtime_when_worked_exceeds_schedule(): void
    {
        config(['app.timezone' => 'UTC']);

        // Build an in-memory employee with a timetable for Friday (weekday 5)
        $timetable = WorkTimetable::make(['name' => 'Standard']);
        $timetable->id = 1;

        // 8-hour schedule: 08:00–17:00 (540 minutes minus 60-min break = 480 expected)
        $day = WorkTimetableDay::make([
            'weekday' => 5,
            'is_rest_day' => false,
            'work_starts_at' => '08:00:00',
            'work_ends_at' => '17:00:00',
            'break_minutes' => 0,
        ]);

        // Manually attach relations without DB
        $timetable->setRelation('days', collect([$day]));

        $employee = Employee::make(['work_timetable_id' => 1]);
        $employee->setRelation('workTimetable', $timetable);

        // Friday 2026-06-12, clocked in 8 hours + 90 minutes = 570 minutes worked
        $clockIn = Carbon::parse('2026-06-12 08:00:00', 'UTC'); // Friday
        $workedMinutes = 570;

        // Expected is 540 (09:00 schedule), so overtime = 30 min
        $overtime = $this->service->overtimeMinutes($employee, $clockIn, $workedMinutes);

        $this->assertSame(30, $overtime);
    }

    #[Test]
    public function it_returns_zero_overtime_when_employee_worked_less_than_scheduled(): void
    {
        config(['app.timezone' => 'UTC']);

        $timetable = WorkTimetable::make(['name' => 'Standard']);
        $timetable->id = 1;

        $day = WorkTimetableDay::make([
            'weekday' => 5,
            'is_rest_day' => false,
            'work_starts_at' => '08:00:00',
            'work_ends_at' => '17:00:00',
            'break_minutes' => 0,
        ]);

        $timetable->setRelation('days', collect([$day]));

        $employee = Employee::make(['work_timetable_id' => 1]);
        $employee->setRelation('workTimetable', $timetable);

        // Only worked 400 minutes — under the scheduled 540 minutes
        $clockIn = Carbon::parse('2026-06-12 08:00:00', 'UTC');

        $this->assertSame(0, $this->service->overtimeMinutes($employee, $clockIn, 400));
    }

    #[Test]
    public function it_returns_zero_overtime_when_day_is_rest_day(): void
    {
        config(['app.timezone' => 'UTC']);

        $timetable = WorkTimetable::make(['name' => 'Standard']);
        $timetable->id = 1;

        // Sunday is a rest day
        $day = WorkTimetableDay::make([
            'weekday' => 7,
            'is_rest_day' => true,
            'work_starts_at' => null,
            'work_ends_at' => null,
        ]);

        $timetable->setRelation('days', collect([$day]));

        $employee = Employee::make(['work_timetable_id' => 1]);
        $employee->setRelation('workTimetable', $timetable);

        $clockIn = Carbon::parse('2026-06-14 08:00:00', 'UTC'); // Sunday

        $this->assertSame(0, $this->service->overtimeMinutes($employee, $clockIn, 600));
    }
}
