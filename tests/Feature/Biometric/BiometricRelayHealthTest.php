<?php

namespace Tests\Feature\Biometric;

use App\Services\Biometric\BiometricRelayStatusStore;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class BiometricRelayHealthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['biometric.relay_token' => 'test-relay-token']);
        Cache::forget('biometric.relay.status');
    }

    public function test_health_requires_token(): void
    {
        $this->getJson('/api/biometric/relay/health')
            ->assertUnauthorized();
    }

    public function test_health_returns_relay_status(): void
    {
        app(BiometricRelayStatusStore::class)->put([
            'status' => 'ok',
            'pending_retries' => 2,
            'last_relay_at' => '2026-07-13T12:00:00+00:00',
            'serial_number' => 'SN123',
        ]);

        $this->withToken('test-relay-token')
            ->getJson('/api/biometric/relay/health')
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('relay.status', 'ok')
            ->assertJsonPath('relay.pending_retries', 2)
            ->assertJsonPath('relay.serial_number', 'SN123');
    }

    public function test_heartbeat_stores_status(): void
    {
        $this->withToken('test-relay-token')
            ->postJson('/api/biometric/relay/heartbeat', [
                'serial_number' => 'OAE7050057042700029',
                'last_relay_at' => '2026-07-13T12:31:18+00:00',
                'last_successful_upload_at' => '2026-07-13T12:31:20+00:00',
                'pending_retries' => 0,
                'status' => 'ok',
                'punches_pulled' => 3,
                'punches_relayed' => 3,
                'failures' => 0,
                'watermark' => '2026-07-13 12:31:18',
            ])
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('relay.status', 'ok')
            ->assertJsonPath('relay.pending_retries', 0);

        $stored = app(BiometricRelayStatusStore::class)->get();

        $this->assertSame('ok', $stored['status']);
        $this->assertSame('2026-07-13 12:31:18', $stored['watermark']);
        $this->assertSame(3, $stored['punches_relayed']);
    }

    public function test_heartbeat_accepts_header_token(): void
    {
        $this->withHeaders(['X-Biometric-Relay-Token' => 'test-relay-token'])
            ->postJson('/api/biometric/relay/heartbeat', [
                'status' => 'idle',
                'pending_retries' => 0,
            ])
            ->assertOk()
            ->assertJsonPath('relay.status', 'idle');
    }
}
