<?php

namespace Tests\Unit\Biometric;

use App\Services\Biometric\ZkDeviceWebHttpTransport;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class ZkDeviceWebReportClientTest extends TestCase
{
    #[Test]
    public function test_bodies_from_psr_body_splits_concatenated_http_responses(): void
    {
        $raw = "HTTP/1.0 200 OK\r\nContent-Length: 0\r\n\r\n"
            ."HTTP/1.0 200 OK\r\n\r\n<html><body>report</body></html>";

        $bodies = ZkDeviceWebHttpTransport::bodiesFromPsrBody($raw);

        $this->assertCount(1, $bodies);
        $this->assertStringContainsString('report', $bodies[0]);
    }

    #[Test]
    public function test_bodies_from_psr_body_returns_plain_html_unchanged(): void
    {
        $html = '<html><table><tr><th>ID Number</th></tr></table></html>';

        $bodies = ZkDeviceWebHttpTransport::bodiesFromPsrBody($html);

        $this->assertSame([$html], $bodies);
    }
}
