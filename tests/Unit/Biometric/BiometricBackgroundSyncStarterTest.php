<?php

namespace Tests\Unit\Biometric;

use App\Enums\BiometricConnectionType;
use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricBackgroundSyncStarter;
use App\Services\Biometric\BiometricSyncPipeline;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class BiometricBackgroundSyncStarterTest extends TestCase
{
    use RefreshDatabase;

    public function test_date_range_sync_does_not_run_inline_when_sync_inline_is_false(): void
    {
        config(['biometric.sync_inline' => false, 'biometric.sync_driver' => 'process']);

        $device = BiometricDevice::query()->create([
            'name' => 'Gate',
            'serial_number' => 'SN-UNIT-1',
            'connection_type' => BiometricConnectionType::TcpPull,
            'host' => '192.168.1.44',
            'is_active' => true,
        ]);

        $pipeline = Mockery::mock(BiometricSyncPipeline::class);
        $pipeline->shouldNotReceive('run');
        $this->app->instance(BiometricSyncPipeline::class, $pipeline);

        app(BiometricBackgroundSyncStarter::class)->start(
            $device->id,
            null,
            '2026-05-14',
            '2026-05-21',
            99,
        );

        $this->addToAssertionCount(1);
    }

    public function test_adms_push_sync_runs_inline_even_when_background_driver_is_process(): void
    {
        config(['biometric.sync_inline' => false, 'biometric.sync_driver' => 'process']);

        $device = BiometricDevice::query()->create([
            'name' => 'ADMS Gate',
            'serial_number' => 'SN-ADMS-INLINE-1',
            'connection_type' => BiometricConnectionType::AdmsPush,
            'is_active' => true,
        ]);

        $pipeline = Mockery::mock(BiometricSyncPipeline::class);
        $pipeline->shouldReceive('parsePullRange')->andReturn([null, null]);
        $pipeline->shouldReceive('run')->once();
        $this->app->instance(BiometricSyncPipeline::class, $pipeline);

        app(BiometricBackgroundSyncStarter::class)->start($device->id, null, '2026-05-15', '2026-05-22', 1);
    }
}
