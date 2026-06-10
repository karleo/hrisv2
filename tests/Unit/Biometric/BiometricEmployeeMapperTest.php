<?php

namespace Tests\Unit\Biometric;

use App\Enums\BiometricPunchDirection;
use App\Models\BiometricDevice;
use App\Models\BiometricPunch;
use App\Models\Employee;
use App\Services\Biometric\BiometricEmployeeMapper;
use App\Services\Biometric\BiometricPunchData;
use App\Services\Biometric\BiometricPunchImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class BiometricEmployeeMapperTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_auto_links_punch_when_employee_pin_matches_device_user_id(): void
    {
        $device = $this->createDevice('SN-MAP-1');

        Employee::factory()->create(['biometric_user_id' => '1']);

        app(BiometricPunchImporter::class)->import($device, [
            new BiometricPunchData('1', Carbon::parse('2026-05-21 08:00:00'), BiometricPunchDirection::In, rawStatus: 0),
        ]);

        $this->assertNotNull(BiometricPunch::query()->value('employee_id'));

        $result = app(BiometricEmployeeMapper::class)->mapForDevice($device);

        $this->assertSame(0, $result['mapped']);
        $this->assertSame(0, $result['unmapped']);
    }

    public function test_mapper_links_existing_unmapped_punches_when_employee_pin_is_set_later(): void
    {
        $device = $this->createDevice('SN-MAP-3');

        config(['biometric.skip_employee_mapping_on_import' => true]);

        app(BiometricPunchImporter::class)->import($device, [
            new BiometricPunchData('88', Carbon::parse('2026-05-21 08:30:00'), BiometricPunchDirection::In, rawStatus: 0),
        ]);

        $this->assertNull(BiometricPunch::query()->value('employee_id'));

        Employee::factory()->create(['biometric_user_id' => '88']);

        $this->assertNotNull(BiometricPunch::query()->value('employee_id'));

        $result = app(BiometricEmployeeMapper::class)->mapForDevice($device);

        $this->assertSame(0, $result['mapped']);
    }

    public function test_mapper_matches_numeric_pin_without_leading_zeros(): void
    {
        $device = $this->createDevice('SN-MAP-2');

        Employee::factory()->create(['biometric_user_id' => '55']);

        app(BiometricPunchImporter::class)->import($device, [
            new BiometricPunchData('055', Carbon::parse('2026-05-21 09:00:00'), BiometricPunchDirection::Out, rawStatus: 1),
        ]);

        $this->assertNotNull(BiometricPunch::query()->value('employee_id'));

        $result = app(BiometricEmployeeMapper::class)->mapForDevice($device);

        $this->assertSame(0, $result['mapped']);
    }

    private function createDevice(string $serialNumber): BiometricDevice
    {
        return BiometricDevice::query()->create([
            'name' => 'Gate',
            'serial_number' => $serialNumber,
            'is_active' => true,
        ]);
    }
}
