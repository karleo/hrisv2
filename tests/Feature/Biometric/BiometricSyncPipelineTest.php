<?php

namespace Tests\Feature\Biometric;

use App\Enums\BiometricConnectionType;
use App\Enums\BiometricPunchDirection;
use App\Enums\BiometricSessionAnomalyType;
use App\Enums\BiometricSyncStatus;
use App\Models\BiometricDevice;
use App\Models\BiometricPunch;
use App\Models\Employee;
use App\Services\Biometric\BiometricConnectorFactory;
use App\Services\Biometric\BiometricPunchData;
use App\Services\Biometric\BiometricPunchImporter;
use App\Services\Biometric\BiometricSessionPairingService;
use App\Services\Biometric\BiometricSyncPipeline;
use App\Services\Biometric\Connectors\FakeBiometricConnector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class BiometricSyncPipelineTest extends TestCase
{
    use RefreshDatabase;

    private FakeBiometricConnector $fakeConnector;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fakeConnector = new FakeBiometricConnector;

        $this->mock(BiometricConnectorFactory::class, function ($mock): void {
            $mock->shouldReceive('forDevice')->andReturn($this->fakeConnector);
        });
    }

    public function test_punch_importer_is_idempotent(): void
    {
        $device = $this->createDevice();
        $importer = app(BiometricPunchImporter::class);

        $punch = new BiometricPunchData(
            deviceUserId: '1001',
            punchedAt: Carbon::parse('2026-05-21 08:00:00'),
            direction: BiometricPunchDirection::In,
            rawStatus: 0,
        );

        $first = $importer->import($device, [$punch]);
        $second = $importer->import($device, [$punch]);

        $this->assertSame(1, $first['inserted']);
        $this->assertSame(0, $first['duplicate']);
        $this->assertSame(0, $second['inserted']);
        $this->assertSame(1, $second['duplicate']);
        $this->assertSame(1, BiometricPunch::query()->count());
    }

    public function test_session_pairing_in_then_out(): void
    {
        $device = $this->createDevice();
        $employee = Employee::factory()->create(['biometric_user_id' => '42']);

        $this->seedPunch($device, '42', '2026-05-21 08:00:00', BiometricPunchDirection::In, $employee->id);
        $this->seedPunch($device, '42', '2026-05-21 17:00:00', BiometricPunchDirection::Out, $employee->id);

        $result = app(BiometricSessionPairingService::class)->processUnprocessedPunches($device);

        $this->assertSame(1, $result['created']);
        $this->assertSame(1, $result['updated']);

        $this->assertDatabaseHas('biometric_attendance_sessions', [
            'employee_id' => $employee->id,
            'is_open' => false,
        ]);

        $this->assertDatabaseMissing('biometric_attendance_sessions', [
            'employee_id' => $employee->id,
            'is_open' => true,
        ]);
    }

    public function test_duplicate_in_logs_anomaly(): void
    {
        $device = $this->createDevice();
        $employee = Employee::factory()->create(['biometric_user_id' => '99']);

        $this->seedPunch($device, '99', '2026-05-21 08:00:00', BiometricPunchDirection::In, $employee->id);
        app(BiometricSessionPairingService::class)->processUnprocessedPunches($device);

        $this->seedPunch($device, '99', '2026-05-21 09:00:00', BiometricPunchDirection::In, $employee->id);
        app(BiometricSessionPairingService::class)->processUnprocessedPunches($device);

        $this->assertDatabaseHas('biometric_session_anomalies', [
            'type' => BiometricSessionAnomalyType::DuplicateIn->value,
            'employee_id' => $employee->id,
        ]);
    }

    public function test_orphan_out_logs_anomaly(): void
    {
        $device = $this->createDevice();
        $employee = Employee::factory()->create(['biometric_user_id' => '77']);

        $this->seedPunch($device, '77', '2026-05-21 17:00:00', BiometricPunchDirection::Out, $employee->id);
        app(BiometricSessionPairingService::class)->processUnprocessedPunches($device);

        $this->assertDatabaseHas('biometric_session_anomalies', [
            'type' => BiometricSessionAnomalyType::OrphanOut->value,
            'employee_id' => $employee->id,
        ]);
    }

    public function test_date_range_pull_reads_all_device_records_then_filters_range(): void
    {
        $device = $this->createDevice(['is_active' => true, 'timezone' => 'UTC']);
        Employee::factory()->create(['biometric_user_id' => '10']);

        $this->fakeConnector->setPunches(
            new BiometricPunchData('10', Carbon::parse('2026-05-01 08:00:00'), BiometricPunchDirection::In, rawStatus: 0),
            new BiometricPunchData('10', Carbon::parse('2026-05-20 08:00:00'), BiometricPunchDirection::In, rawStatus: 0),
            new BiometricPunchData('10', Carbon::parse('2026-06-01 08:00:00'), BiometricPunchDirection::In, rawStatus: 0),
        );

        $log = app(BiometricSyncPipeline::class)->run(
            $device,
            triggeredBy: null,
            from: Carbon::parse('2026-05-20 00:00:00', 'UTC'),
            until: Carbon::parse('2026-05-20 23:59:59', 'UTC'),
        );

        $this->assertSame(BiometricSyncStatus::Completed, $log->status);
        $this->assertSame(3, $log->fetched_count);
        $this->assertSame(1, $log->inserted_count);
        $this->assertSame(1, $log->error_metadata['in_range'] ?? null);
    }

    public function test_sync_pipeline_completes_with_counts(): void
    {
        $device = $this->createDevice(['is_active' => true]);
        $employee = Employee::factory()->create(['biometric_user_id' => '5']);

        $this->fakeConnector->setPunches(
            new BiometricPunchData('5', Carbon::parse('2026-05-21 08:00:00'), BiometricPunchDirection::In, rawStatus: 0),
            new BiometricPunchData('5', Carbon::parse('2026-05-21 17:00:00'), BiometricPunchDirection::Out, rawStatus: 1),
        );

        $log = app(BiometricSyncPipeline::class)->run($device);

        $this->assertSame(BiometricSyncStatus::Completed, $log->status);
        $this->assertSame(2, $log->fetched_count);
        $this->assertSame(2, $log->inserted_count);
        $this->assertSame(1, $log->sessions_created_count);
        $this->assertSame(1, $log->sessions_updated_count);
        $this->assertNotNull($device->fresh()->last_sync_at);
    }

    private function createDevice(array $overrides = []): BiometricDevice
    {
        return BiometricDevice::query()->create(array_merge([
            'name' => 'Test device',
            'model' => 'iClock990',
            'serial_number' => 'TEST-'.uniqid(),
            'connection_type' => BiometricConnectionType::TcpPull,
            'host' => '127.0.0.1',
            'port' => 4370,
            'timezone' => 'UTC',
            'is_active' => true,
        ], $overrides));
    }

    private function seedPunch(
        BiometricDevice $device,
        string $deviceUserId,
        string $punchedAt,
        BiometricPunchDirection $direction,
        ?int $employeeId,
    ): BiometricPunch {
        $importer = app(BiometricPunchImporter::class);
        $data = new BiometricPunchData($deviceUserId, Carbon::parse($punchedAt), $direction, rawStatus: $direction === BiometricPunchDirection::In ? 0 : 1);
        $importer->import($device, [$data]);

        $punch = BiometricPunch::query()->where('device_user_id', $deviceUserId)->where('punched_at', $punchedAt)->firstOrFail();
        if ($employeeId !== null) {
            $punch->update(['employee_id' => $employeeId]);
        }

        return $punch;
    }
}
