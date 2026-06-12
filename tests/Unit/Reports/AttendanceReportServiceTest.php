<?php

namespace Tests\Unit\Reports;

use App\Enums\AttendanceWorkMode;
use App\Enums\BiometricConnectionType;
use App\Enums\BiometricPunchDirection;
use App\Models\BiometricDevice;
use App\Models\BiometricPunch;
use App\Models\Employee;
use App\Models\EmployeeTimeEntry;
use App\Services\Reports\AttendanceReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceReportServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_uses_first_in_and_last_out_for_normal_day(): void
    {
        $device = $this->createDevice();
        $employee = Employee::factory()->create(['biometric_user_id' => '118']);

        $this->createPunch($device, '118', $employee->id, '2026-05-25 08:00:00', BiometricPunchDirection::In, 'in-1');
        $this->createPunch($device, '118', $employee->id, '2026-05-25 12:30:00', BiometricPunchDirection::In, 'in-2');
        $this->createPunch($device, '118', $employee->id, '2026-05-25 17:00:00', BiometricPunchDirection::Out, 'out-1');

        $row = $this->firstRow();

        $this->assertSame('08:00:00', $row['clock_in']);
        $this->assertSame('17:00:00', $row['clock_out']);
        $this->assertSame('9h', $row['working_hours']);
    }

    public function test_ignores_spurious_checkout_within_five_minutes(): void
    {
        $device = $this->createDevice();

        $this->createPunch($device, '119', null, '2026-05-25 09:44:17', BiometricPunchDirection::In, 'dup-in');
        $this->createPunch($device, '119', null, '2026-05-25 09:44:20', BiometricPunchDirection::Out, 'dup-out');

        $row = $this->firstRow();

        $this->assertSame('09:44:17', $row['clock_in']);
        $this->assertNull($row['clock_out']);
        $this->assertSame('—', $row['working_hours']);
        $this->assertSame(2, $row['punch_count']);
    }

    public function test_rows_are_sorted_by_date_ascending(): void
    {
        $device = $this->createDevice();
        $employee = Employee::factory()->create(['biometric_user_id' => '77']);

        $this->createPunch($device, '77', $employee->id, '2026-05-25 09:00:00', BiometricPunchDirection::In, 'sort-new');
        $this->createPunch($device, '77', $employee->id, '2026-05-18 09:00:00', BiometricPunchDirection::In, 'sort-old');
        $this->createPunch($device, '77', $employee->id, '2026-05-20 09:00:00', BiometricPunchDirection::In, 'sort-mid');

        $result = app(AttendanceReportService::class)->buildForEmployee(
            $employee,
            from: '2026-05-18',
            to: '2026-05-25',
        );

        $this->assertSame(
            ['2026-05-18', '2026-05-20', '2026-05-25'],
            array_column($result['rows'], 'date'),
        );
    }

    public function test_build_for_employee_includes_punches_by_device_pin(): void
    {
        $device = $this->createDevice();
        $employee = Employee::factory()->create(['biometric_user_id' => '55']);

        $this->createPunch($device, '55', null, '2026-05-25 09:00:00', BiometricPunchDirection::In, 'emp-pin-in');
        $this->createPunch($device, '55', null, '2026-05-25 17:00:00', BiometricPunchDirection::Out, 'emp-pin-out');

        $result = app(AttendanceReportService::class)->buildForEmployee(
            $employee,
            from: '2026-05-25',
            to: '2026-05-25',
        );

        $this->assertCount(1, $result['rows']);
        $this->assertSame('09:00:00', $result['rows'][0]['clock_in']);
        $this->assertSame('17:00:00', $result['rows'][0]['clock_out']);
        $this->assertSame(2, $result['total_punches']);
    }

    public function test_calculates_overtime_from_work_timetable(): void
    {
        $device = $this->createDevice();
        $employee = Employee::factory()->create(['biometric_user_id' => '200']);

        $this->createPunch($device, '200', $employee->id, '2026-05-25 08:00:00', BiometricPunchDirection::In, 'ot-in');
        $this->createPunch($device, '200', $employee->id, '2026-05-25 19:00:00', BiometricPunchDirection::Out, 'ot-out');

        $row = app(AttendanceReportService::class)->buildForEmployee(
            $employee,
            from: '2026-05-25',
            to: '2026-05-25',
        )['rows'][0];

        $this->assertSame('11h', $row['working_hours']);
        $this->assertSame('3h', $row['overtime']);
    }

    public function test_shows_dash_when_worked_within_scheduled_hours(): void
    {
        $device = $this->createDevice();
        $employee = Employee::factory()->create(['biometric_user_id' => '201']);

        $this->createPunch($device, '201', $employee->id, '2026-05-25 09:00:00', BiometricPunchDirection::In, 'no-ot-in');
        $this->createPunch($device, '201', $employee->id, '2026-05-25 17:00:00', BiometricPunchDirection::Out, 'no-ot-out');

        $row = app(AttendanceReportService::class)->buildForEmployee(
            $employee,
            from: '2026-05-25',
            to: '2026-05-25',
        )['rows'][0];

        $this->assertSame('8h', $row['working_hours']);
        $this->assertSame('—', $row['overtime']);
    }

    public function test_includes_manual_check_in_entries_without_biometric_pin(): void
    {
        $employee = Employee::factory()->create(['biometric_user_id' => null]);

        EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => '2026-05-25 09:15:00',
            'clock_out_at' => '2026-05-25 17:30:00',
            'work_mode' => AttendanceWorkMode::WorkFromHome->value,
        ]);

        $result = app(AttendanceReportService::class)->buildForEmployee(
            $employee,
            from: '2026-05-25',
            to: '2026-05-25',
        );

        $this->assertCount(1, $result['rows']);
        $this->assertSame('09:15:00', $result['rows'][0]['clock_in']);
        $this->assertSame('17:30:00', $result['rows'][0]['clock_out']);
        $this->assertSame('manual', $result['rows'][0]['source']);
        $this->assertSame('Work from Home', $result['rows'][0]['work_mode_label']);
        $this->assertSame(1, $result['total_manual_entries']);
        $this->assertSame(0, $result['total_punches']);
    }

    public function test_includes_manual_remarks_and_evidence_in_report_rows(): void
    {
        $employee = Employee::factory()->create(['biometric_user_id' => null]);

        EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => '2026-05-25 09:00:00',
            'clock_out_at' => '2026-05-25 17:00:00',
            'work_mode' => AttendanceWorkMode::FieldDriver->value,
            'check_in_remarks' => 'Starting route in Makati.',
            'check_out_remarks' => 'Finished deliveries.',
            'check_in_photo_path' => 'attendance-photos/check-in.jpg',
            'check_out_photo_path' => 'attendance-photos/check-out.jpg',
            'check_in_latitude' => 14.5547,
            'check_in_longitude' => 121.0244,
            'check_out_latitude' => 14.5995,
            'check_out_longitude' => 120.9842,
        ]);

        $row = app(AttendanceReportService::class)->buildForEmployee(
            $employee,
            from: '2026-05-25',
            to: '2026-05-25',
        )['rows'][0];

        $this->assertSame('Starting route in Makati.', $row['check_in_remarks']);
        $this->assertSame('Finished deliveries.', $row['check_out_remarks']);
        $this->assertSame('/storage/attendance-photos/check-in.jpg', $row['check_in_photo_url']);
        $this->assertSame('/storage/attendance-photos/check-out.jpg', $row['check_out_photo_url']);
        $this->assertSame(14.5547, $row['check_in_latitude']);
        $this->assertSame(121.0244, $row['check_in_longitude']);
        $this->assertSame(14.5995, $row['check_out_latitude']);
        $this->assertSame(120.9842, $row['check_out_longitude']);
    }

    public function test_merges_manual_and_biometric_clock_times_for_same_day(): void
    {
        $device = $this->createDevice();
        $employee = Employee::factory()->create(['biometric_user_id' => '88']);

        $this->createPunch($device, '88', $employee->id, '2026-05-25 08:30:00', BiometricPunchDirection::In, 'merge-in');
        $this->createPunch($device, '88', $employee->id, '2026-05-25 16:00:00', BiometricPunchDirection::Out, 'merge-out');

        EmployeeTimeEntry::query()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => '2026-05-25 08:00:00',
            'clock_out_at' => '2026-05-25 18:00:00',
            'work_mode' => AttendanceWorkMode::FieldDriver->value,
        ]);

        $row = app(AttendanceReportService::class)->buildForEmployee(
            $employee,
            from: '2026-05-25',
            to: '2026-05-25',
        )['rows'][0];

        $this->assertSame('08:00:00', $row['clock_in']);
        $this->assertSame('18:00:00', $row['clock_out']);
        $this->assertSame('merged', $row['source']);
        $this->assertSame('Field – Driver', $row['work_mode_label']);
        $this->assertStringContainsString('Web check-in', (string) $row['device_name']);
    }

    public function test_collapses_rapid_duplicate_check_ins(): void
    {
        $device = $this->createDevice();

        $this->createPunch($device, '120', null, '2026-05-25 10:02:51', BiometricPunchDirection::In, 'rapid-in-1');
        $this->createPunch($device, '120', null, '2026-05-25 10:02:52', BiometricPunchDirection::In, 'rapid-in-2');
        $this->createPunch($device, '120', null, '2026-05-25 18:00:00', BiometricPunchDirection::Out, 'rapid-out');

        $row = $this->firstRow();

        $this->assertSame('10:02:51', $row['clock_in']);
        $this->assertSame('18:00:00', $row['clock_out']);
        $this->assertSame('7h 57m', $row['working_hours']);
    }

    private function firstRow(): array
    {
        $result = app(AttendanceReportService::class)->build(
            from: '2026-05-25',
            to: '2026-05-25',
        );

        return $result['rows'][0];
    }

    private function createDevice(): BiometricDevice
    {
        return BiometricDevice::query()->create([
            'name' => 'Main gate',
            'serial_number' => 'SN-UNIT-REPORT',
            'connection_type' => BiometricConnectionType::DeviceWebReport,
            'host' => '192.168.1.44',
            'port' => 80,
            'timezone' => 'UTC',
            'is_active' => true,
        ]);
    }

    private function createPunch(
        BiometricDevice $device,
        string $deviceUserId,
        ?int $employeeId,
        string $punchedAt,
        BiometricPunchDirection $direction,
        string $idempotencyKey,
    ): void {
        BiometricPunch::query()->create([
            'biometric_device_id' => $device->id,
            'device_user_id' => $deviceUserId,
            'employee_id' => $employeeId,
            'punched_at' => $punchedAt,
            'direction' => $direction,
            'idempotency_key' => $idempotencyKey,
        ]);
    }
}
