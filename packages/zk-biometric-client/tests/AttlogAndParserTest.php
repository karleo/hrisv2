<?php

namespace PrimeLogistics\ZkBiometricClient\Tests;

use PHPUnit\Framework\TestCase;
use PrimeLogistics\ZkBiometricClient\Attlog\AttlogFormatter;
use PrimeLogistics\ZkBiometricClient\Punch\PunchDirection;
use PrimeLogistics\ZkBiometricClient\Punch\PunchRecord;
use PrimeLogistics\ZkBiometricClient\WebReport\HtmlParser;

class AttlogAndParserTest extends TestCase
{
    public function test_attlog_formatter_builds_tab_separated_line(): void
    {
        $punch = PunchRecord::fromDeviceWallClock(
            deviceUserId: '1001',
            punchedAtStorage: '2026-07-13 08:30:00',
            direction: PunchDirection::In,
            timezone: 'Asia/Dubai',
            verifyType: 1,
            workCode: '0',
            rawStatus: 0,
        );

        $line = (new AttlogFormatter)->line($punch);

        $this->assertSame("1001\t2026-07-13 08:30:00\t0\t1\t0\t0", $line);
        $this->assertStringContainsString('/iclock/cdata?SN=ABC&table=ATTLOG', (new AttlogFormatter)->cdataEndpoint('http://example.test', 'ABC'));
    }

    public function test_html_parser_reads_event_layout(): void
    {
        $html = <<<'HTML'
        <html><body><table>
        <tr><th>ID Number</th><th>Time</th><th>State</th></tr>
        <tr><td>42</td><td>2026-07-13 09:15:00</td><td>Check-In</td></tr>
        <tr><td>42</td><td>2026-07-13 17:45:00</td><td>Check-Out</td></tr>
        </table></body></html>
        HTML;

        $punches = (new HtmlParser)->parse($html, 'Asia/Dubai');

        $this->assertCount(2, $punches);
        $this->assertSame('42', $punches[0]->deviceUserId);
        $this->assertSame('2026-07-13 09:15:00', $punches[0]->punchedAtStorage);
        $this->assertSame(PunchDirection::In, $punches[0]->direction);
        $this->assertSame(PunchDirection::Out, $punches[1]->direction);
    }
}
