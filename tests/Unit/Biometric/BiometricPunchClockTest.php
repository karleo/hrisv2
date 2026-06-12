<?php

namespace Tests\Unit\Biometric;

use App\Services\Biometric\BiometricPunchClock;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class BiometricPunchClockTest extends TestCase
{
    #[Test]
    public function test_normalize_wall_clock_keeps_device_time_literal(): void
    {
        $this->assertSame(
            '2026-05-25 09:50:48',
            BiometricPunchClock::normalizeWallClock('2026-05-25', '09:50:48'),
        );
    }

    #[Test]
    public function test_normalize_timestamp_keeps_full_device_timestamp_literal(): void
    {
        $this->assertSame(
            '2026-05-22 08:15:30',
            BiometricPunchClock::normalizeTimestamp('2026-05-22 08:15:30'),
        );
    }

    #[Test]
    public function test_string_bounds_compare_without_timezone_math(): void
    {
        $this->assertTrue(BiometricPunchClock::isBefore('2026-05-24 23:59:59', '2026-05-25 00:00:00'));
        $this->assertFalse(BiometricPunchClock::isAfter('2026-05-25 09:00:00', '2026-05-25 18:00:00'));
    }
}
