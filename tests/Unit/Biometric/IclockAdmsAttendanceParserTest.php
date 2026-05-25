<?php

namespace Tests\Unit\Biometric;

use App\Enums\BiometricConnectionType;
use App\Enums\BiometricPunchDirection;
use App\Models\BiometricDevice;
use App\Services\Biometric\IclockAdmsAttendanceParser;
use PHPUnit\Framework\TestCase;

class IclockAdmsAttendanceParserTest extends TestCase
{
    public function test_parses_tab_separated_att_log_line(): void
    {
        $device = new BiometricDevice([
            'timezone' => 'Asia/Dubai',
            'connection_type' => BiometricConnectionType::AdmsPush,
        ]);

        $parser = new IclockAdmsAttendanceParser;
        $punch = $parser->parseLine($device, "1001\t2026-05-21 08:30:00\t0\t1\t0\t0");

        $this->assertNotNull($punch);
        $this->assertSame('1001', $punch->deviceUserId);
        $this->assertSame(BiometricPunchDirection::In, $punch->direction);
        $this->assertSame('2026-05-21 04:30:00', $punch->punchedAt->format('Y-m-d H:i:s'));
    }
}
