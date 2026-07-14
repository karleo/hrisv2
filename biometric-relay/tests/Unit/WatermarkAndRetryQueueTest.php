<?php

namespace BiometricRelay\Tests\Unit;

use BiometricRelay\Relay\RetryQueue;
use BiometricRelay\Relay\WatermarkStore;
use PHPUnit\Framework\TestCase;
use PrimeLogistics\ZkBiometricClient\Punch\PunchDirection;
use PrimeLogistics\ZkBiometricClient\Punch\PunchRecord;

class WatermarkAndRetryQueueTest extends TestCase
{
    private string $dir;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'biometric-relay-test-'.uniqid();
        mkdir($this->dir, 0777, true);
    }

    protected function tearDown(): void
    {
        foreach (glob($this->dir.DIRECTORY_SEPARATOR.'*') ?: [] as $file) {
            unlink($file);
        }

        rmdir($this->dir);

        parent::tearDown();
    }

    public function test_watermark_advances_on_write(): void
    {
        $store = new WatermarkStore($this->dir.DIRECTORY_SEPARATOR.'state.json');

        $this->assertNull($store->watermark());

        $store->write('2026-07-13 12:31:18', ['status' => 'ok']);

        $this->assertSame('2026-07-13 12:31:18', $store->watermark());
        $this->assertSame('ok', $store->read()['last_run_summary']['status']);
    }

    public function test_retry_queue_persists_and_dedupes(): void
    {
        $queue = new RetryQueue($this->dir.DIRECTORY_SEPARATOR.'pending.json', 'Asia/Dubai');

        $punch = PunchRecord::fromDeviceWallClock(
            deviceUserId: '9',
            punchedAtStorage: '2026-07-13 08:00:00',
            direction: PunchDirection::In,
            timezone: 'Asia/Dubai',
        );

        $queue->append([$punch, $punch]);

        $this->assertCount(1, $queue->all());
        $this->assertSame('9', $queue->all()[0]->deviceUserId);

        $queue->clear();
        $this->assertSame(0, $queue->count());
    }
}
