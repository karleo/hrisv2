<?php

namespace Tests\Feature\Biometric;

use App\Enums\BiometricConnectionType;
use App\Models\BiometricAdmsCommand;
use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricAdmsCommandQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AdmsCommandQueueTest extends TestCase
{
    use RefreshDatabase;

    public function test_queue_attlog_pull_replaces_previous_pending_commands(): void
    {
        $device = BiometricDevice::query()->create([
            'name' => 'Queue test',
            'model' => 'iClock990',
            'serial_number' => 'SN-QUEUE-CLEAR',
            'connection_type' => BiometricConnectionType::AdmsPush,
            'host' => null,
            'port' => 4370,
            'timezone' => 'Asia/Dubai',
            'is_active' => true,
        ]);

        $queue = app(BiometricAdmsCommandQueue::class);

        $queue->queueAttlogPull(
            $device,
            Carbon::parse('2026-06-01 00:00:00', 'Asia/Dubai'),
            Carbon::parse('2026-06-30 23:59:59', 'Asia/Dubai'),
        );

        $this->assertSame(5, $queue->pendingCount('SN-QUEUE-CLEAR'));

        $queue->queueAttlogPull(
            $device,
            Carbon::parse('2026-07-01 00:00:00', 'Asia/Dubai'),
            Carbon::parse('2026-07-13 23:59:59', 'Asia/Dubai'),
        );

        $this->assertSame(5, $queue->pendingCount('SN-QUEUE-CLEAR'));
        $this->assertSame(5, BiometricAdmsCommand::query()->where('serial_number', 'SN-QUEUE-CLEAR')->count());
        $this->assertDatabaseHas('biometric_adms_commands', [
            'serial_number' => 'SN-QUEUE-CLEAR',
            'command' => "DATA QUERY ATTLOG StartTime=2026-07-01 00:00:00\tEndTime=2026-07-13 23:59:59",
        ]);
        $this->assertDatabaseMissing('biometric_adms_commands', [
            'serial_number' => 'SN-QUEUE-CLEAR',
            'command' => "DATA QUERY ATTLOG StartTime=2026-06-01 00:00:00\tEndTime=2026-06-30 23:59:59",
        ]);
    }
}
