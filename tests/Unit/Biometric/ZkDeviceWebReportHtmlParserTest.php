<?php

namespace Tests\Unit\Biometric;

use App\Enums\BiometricPunchDirection;
use App\Services\Biometric\ZkDeviceWebReportHtmlParser;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class ZkDeviceWebReportHtmlParserTest extends TestCase
{
    #[Test]
    public function test_parses_attendance_table_with_in_and_out_columns(): void
    {
        $html = <<<'HTML'
<html><body>
<table>
<tr><th>Date</th><th>ID Number</th><th>Name</th><th>IN</th><th>OUT</th></tr>
<tr><td>2024-05-21</td><td>55</td><td>AHAMED MANSOOR</td><td>09:50:48</td><td>18:54:01</td></tr>
</table>
</body></html>
HTML;

        $punches = (new ZkDeviceWebReportHtmlParser)->parse($html, 'Asia/Dubai');

        $this->assertCount(2, $punches);
        $this->assertSame('55', $punches[0]->deviceUserId);
        $this->assertSame(BiometricPunchDirection::In, $punches[0]->direction);
        $this->assertSame(BiometricPunchDirection::Out, $punches[1]->direction);
        $this->assertSame('09:50:48', $punches[0]->rawPayload['time']);
    }

    #[Test]
    public function test_parses_pin_timestamp_state_layout(): void
    {
        $html = <<<'HTML'
<html><body>
<table>
<tr><th>PIN</th><th>Timestamp</th><th>Status</th></tr>
<tr><td>12</td><td>2026-05-22 08:15:30</td><td>Check In</td></tr>
<tr><td>12</td><td>2026-05-22 17:02:11</td><td>Check Out</td></tr>
</table>
</body></html>
HTML;

        $result = (new ZkDeviceWebReportHtmlParser)->parseWithDiagnostics($html, 'Asia/Dubai');

        $this->assertCount(2, $result->punches);
        $this->assertSame('12', $result->punches[0]->deviceUserId);
        $this->assertSame(BiometricPunchDirection::In, $result->punches[0]->direction);
        $this->assertSame(BiometricPunchDirection::Out, $result->punches[1]->direction);
        $this->assertSame('pin_timestamp_state', $result->layout);
    }

    #[Test]
    public function test_parse_diagnostics_logs_empty_table_shell(): void
    {
        $html = file_get_contents(__DIR__.'/../../../scripts/zk-probe-output/report-with-uids.html');

        $this->assertIsString($html);

        $result = (new ZkDeviceWebReportHtmlParser)->parseWithDiagnostics($html, 'Asia/Dubai');

        $this->assertSame([], $result->punches);
        $this->assertSame(0, $result->dataRows);
        $this->assertLessThanOrEqual(1, $result->rowsScanned);
    }
}
