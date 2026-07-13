<?php

namespace Tests\Unit\Biometric;

use App\Support\BiometricPushUrl;
use Tests\TestCase;

class BiometricPushUrlTest extends TestCase
{
    public function test_prefer_http_rewrites_https_push_base_for_devices(): void
    {
        config([
            'biometric.push_base_url' => 'https://hris-stag.example.test',
            'biometric.push_prefer_http' => true,
        ]);

        $this->assertSame('http://hris-stag.example.test', BiometricPushUrl::baseUrl());
        $this->assertSame('http://hris-stag.example.test/iclock/cdata', BiometricPushUrl::cdataEndpoint());
        $this->assertSame('hris-stag.example.test', BiometricPushUrl::hostForDeviceMenu());
        $this->assertSame(80, BiometricPushUrl::portForDeviceMenu());
        $this->assertFalse(BiometricPushUrl::usesHttps());
        $this->assertSame('https://hris-stag.example.test', BiometricPushUrl::configuredBaseUrl());
    }

    public function test_prefer_http_can_be_disabled(): void
    {
        config([
            'biometric.push_base_url' => 'https://hris-stag.example.test',
            'biometric.push_prefer_http' => false,
        ]);

        $this->assertSame('https://hris-stag.example.test/iclock/cdata', BiometricPushUrl::cdataEndpoint());
        $this->assertTrue(BiometricPushUrl::usesHttps());
        $this->assertSame(443, BiometricPushUrl::portForDeviceMenu());
    }
}
