<?php

namespace Tests\Unit;

use App\Models\BiometricSetting;
use App\Models\Employee;
use App\Models\EmployeeTimeEntry;
use App\Models\WorkTimetable;
use App\Services\BiometricPunchPairingService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BiometricPunchPairingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_pairs_two_punches_into_a_single_time_entry(): void
    {
        $employee = Employee::factory()->create([
            'employee_code' => 'E1001',
            'work_timetable_id' => WorkTimetable::query()->firstOrFail()->id,
        ]);
        $settings = BiometricSetting::current();

        /** @var BiometricPunchPairingService $service */
        $service = app(BiometricPunchPairingService::class);
        $result = $service->applyPunches($settings, [
            [
                'log_id' => '10',
                'employee_identifier' => 'E1001',
                'punched_at' => CarbonImmutable::parse('2026-04-17 09:00:00', 'Asia/Manila'),
                'event' => 'punch',
            ],
            [
                'log_id' => '11',
                'employee_identifier' => 'E1001',
                'punched_at' => CarbonImmutable::parse('2026-04-17 18:00:00', 'Asia/Manila'),
                'event' => 'punch',
            ],
        ]);

        $entry = EmployeeTimeEntry::query()->where('employee_id', $employee->id)->first();
        $this->assertNotNull($entry);
        $this->assertNotNull($entry->clock_out_at);
        $this->assertSame(2, $result['processed']);
        $this->assertSame(0, $result['skipped']);
    }

    public function test_it_skips_near_duplicate_punches_based_on_window(): void
    {
        Employee::factory()->create([
            'employee_code' => 'E1002',
            'work_timetable_id' => WorkTimetable::query()->firstOrFail()->id,
        ]);
        $settings = BiometricSetting::current();
        $settings->update([
            'duplicate_window_seconds' => 90,
        ]);

        /** @var BiometricPunchPairingService $service */
        $service = app(BiometricPunchPairingService::class);
        $result = $service->applyPunches($settings, [
            [
                'log_id' => '20',
                'employee_identifier' => 'E1002',
                'punched_at' => CarbonImmutable::parse('2026-04-17 09:00:00', 'Asia/Manila'),
                'event' => 'punch',
            ],
            [
                'log_id' => '21',
                'employee_identifier' => 'E1002',
                'punched_at' => CarbonImmutable::parse('2026-04-17 09:00:30', 'Asia/Manila'),
                'event' => 'punch',
            ],
        ]);

        $this->assertSame(1, $result['processed']);
        $this->assertSame(1, $result['skipped']);
    }
}
