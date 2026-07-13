<?php

namespace Tests\Feature\Biometric;

use App\Enums\BiometricConnectionType;
use App\Models\BiometricAdmsCommand;
use App\Models\BiometricDevice;
use App\Models\BiometricSetting;
use App\Services\Biometric\BiometricAdmsCommandQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AdmsHistoryPullTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        BiometricSetting::current()->update([
            'is_enabled' => true,
            'comm_key' => null,
        ]);
    }

    public function test_handshake_returns_attlog_stamp_zero_by_default(): void
    {
        $this->createAdmsDevice('SN-STAMP-0');

        $this->get('/iclock/cdata?SN=SN-STAMP-0')
            ->assertOk()
            ->assertSee('ATTLOGStamp=0')
            ->assertSee('OPERLOGStamp=0')
            ->assertDontSee('ATTLOGStamp='.now()->format('YmdHis'));
    }

    public function test_handshake_echoes_stamp_saved_from_attlog_post(): void
    {
        $device = $this->createAdmsDevice('SN-STAMP-ECHO');

        $payload = "1001\t2026-06-15 08:00:00\t0\t1\t0\t0";

        $this->call(
            'POST',
            '/iclock/cdata?SN=SN-STAMP-ECHO&table=ATTLOG&Stamp=20260615170000',
            server: ['CONTENT_TYPE' => 'text/plain'],
            content: $payload,
        )->assertOk()->assertSee('OK');

        $this->assertSame('20260615170000', $device->fresh()->metadata['last_attlog_stamp'] ?? null);

        $this->get('/iclock/cdata?SN=SN-STAMP-ECHO')
            ->assertOk()
            ->assertSee('ATTLOGStamp=20260615170000');
    }

    public function test_queue_attlog_pull_resets_stamp_and_stores_commands_in_database(): void
    {
        $device = $this->createAdmsDevice('SN-QUEUE-1', [
            'metadata' => [
                'last_attlog_stamp' => '20260713120000',
                'last_operlog_stamp' => '20260713120000',
            ],
        ]);

        $queue = app(BiometricAdmsCommandQueue::class);
        $queue->queueAttlogPull(
            $device,
            Carbon::parse('2026-06-01 00:00:00', 'Asia/Dubai'),
            Carbon::parse('2026-06-30 23:59:59', 'Asia/Dubai'),
        );

        $device->refresh();
        $this->assertSame('0', $device->metadata['last_attlog_stamp'] ?? null);
        $this->assertSame('0', $device->metadata['last_operlog_stamp'] ?? null);
        $this->assertSame(5, $queue->pendingCount('SN-QUEUE-1'));
        $this->assertSame(5, BiometricAdmsCommand::query()->where('serial_number', 'SN-QUEUE-1')->count());
        $this->assertDatabaseHas('biometric_adms_commands', [
            'serial_number' => 'SN-QUEUE-1',
            'command' => "DATA QUERY ATTLOG StartTime=2026-06-01 00:00:00\tEndTime=2026-06-30 23:59:59",
        ]);
    }

    public function test_getrequest_drains_database_commands_for_serial(): void
    {
        $this->createAdmsDevice('SN-DRAIN-1');

        $queue = app(BiometricAdmsCommandQueue::class);
        $queue->queueAttlogPull(
            BiometricDevice::query()->where('serial_number', 'SN-DRAIN-1')->firstOrFail(),
            Carbon::parse('2026-06-01 00:00:00', 'Asia/Dubai'),
            Carbon::parse('2026-06-30 23:59:59', 'Asia/Dubai'),
        );

        $response = $this->get('/iclock/getrequest?SN=SN-DRAIN-1')->assertOk();
        $body = $response->getContent();

        $this->assertStringContainsString('DATA QUERY ATTLOG', $body);
        $this->assertStringContainsString('StartTime=2026-06-01 00:00:00', $body);
        $this->assertSame(0, $queue->pendingCount('SN-DRAIN-1'));
        $this->assertSame(0, BiometricAdmsCommand::query()->where('serial_number', 'SN-DRAIN-1')->count());

        $this->get('/iclock/getrequest?SN=SN-DRAIN-1')->assertOk()->assertSee('OK');
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createAdmsDevice(string $serial, array $overrides = []): BiometricDevice
    {
        return BiometricDevice::query()->create(array_merge([
            'name' => 'ADMS test '.$serial,
            'model' => 'iClock990',
            'serial_number' => $serial,
            'connection_type' => BiometricConnectionType::AdmsPush,
            'host' => null,
            'port' => 4370,
            'timezone' => 'Asia/Dubai',
            'is_active' => true,
            'metadata' => [],
        ], $overrides));
    }
}
