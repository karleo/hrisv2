<?php

namespace Tests\Unit\Biometric;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class ZkDeviceWebReportUserIdParserTest extends TestCase
{
    #[Test]
    public function test_parses_uid_checkboxes_from_report_index_fixture(): void
    {
        $html = file_get_contents(__DIR__.'/../../../scripts/zk-probe-output/report-index.html');

        $this->assertIsString($html);

        $ids = $this->parseDeviceUserIds($html);

        $this->assertContains('1', $ids);
        $this->assertContains('20', $ids);
        $this->assertGreaterThanOrEqual(20, count($ids));
    }

    /**
     * @return list<string>
     */
    private function parseDeviceUserIds(string $html): array
    {
        $method = new ReflectionMethod(
            \App\Services\Biometric\ZkDeviceWebReportClient::class,
            'parseDeviceUserIds',
        );
        $method->setAccessible(true);

        /** @var list<string> $ids */
        $ids = $method->invoke(new \App\Services\Biometric\ZkDeviceWebReportClient(
            new \App\Services\Biometric\ZkDeviceWebReportHtmlParser,
            new \App\Services\Biometric\BiometricPipelineTracer,
        ), $html);

        return $ids;
    }
}
