<?php

namespace Tests\Unit\Biometric;

use App\Enums\BiometricConnectionType;
use App\Enums\BiometricPunchDirection;
use App\Models\BiometricDevice;
use App\Services\Biometric\BiometricFileUploadParser;
use App\Services\Biometric\IclockAdmsAttendanceParser;
use PHPUnit\Framework\TestCase;

class BiometricFileUploadParserTest extends TestCase
{
    private function device(): BiometricDevice
    {
        return new BiometricDevice([
            'timezone' => 'Asia/Dubai',
            'connection_type' => BiometricConnectionType::AdmsPush,
        ]);
    }

    public function test_parses_zk_attlog_file(): void
    {
        $parser = new BiometricFileUploadParser(new IclockAdmsAttendanceParser);
        $contents = "1001\t2026-05-21 08:30:00\t0\t1\n1001\t2026-05-21 17:00:00\t1\t1\n";

        $result = $parser->parse($this->device(), $contents);

        $this->assertSame('zk_attlog', $result['format']);
        $this->assertSame(2, $result['lines_parsed']);
        $this->assertSame(BiometricPunchDirection::In, $result['punches'][0]->direction);
        $this->assertSame(BiometricPunchDirection::Out, $result['punches'][1]->direction);
    }

    public function test_parses_zk_csv_export(): void
    {
        $parser = new BiometricFileUploadParser(new IclockAdmsAttendanceParser);
        $contents = <<<'CSV'
User ID,Date,Time,State
1001,2026-05-21,08:30:00,Check-In
1001,2026-05-21,17:00:00,Check-Out
CSV;

        $result = $parser->parse($this->device(), $contents);

        $this->assertSame('zk_csv', $result['format']);
        $this->assertSame(2, $result['lines_parsed']);
        $this->assertSame('1001', $result['punches'][0]->deviceUserId);
        $this->assertSame('2026-05-21 08:30:00', $result['punches'][0]->punchedAtStorage);
        $this->assertSame(BiometricPunchDirection::In, $result['punches'][0]->direction);
        $this->assertSame(BiometricPunchDirection::Out, $result['punches'][1]->direction);
    }

    public function test_parses_csv_with_datetime_column(): void
    {
        $parser = new BiometricFileUploadParser(new IclockAdmsAttendanceParser);
        $contents = <<<'CSV'
PIN,Timestamp,Status
42,2026-06-01 09:15:00,0
CSV;

        $result = $parser->parse($this->device(), $contents, 'zk_csv');

        $this->assertSame(1, $result['lines_parsed']);
        $this->assertSame('42', $result['punches'][0]->deviceUserId);
        $this->assertSame('2026-06-01 09:15:00', $result['punches'][0]->punchedAtStorage);
    }
}
