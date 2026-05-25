<?php

namespace Tests\Unit\Biometric;

use App\Services\Biometric\ZkTecoConnectGuard;
use Mithun\PhpZkteco\Libs\Services\Util;
use PHPUnit\Framework\TestCase;

class ZkTecoConnectGuardTest extends TestCase
{
    public function test_connect_succeeded_accepts_ack_codes_only(): void
    {
        $guard = new ZkTecoConnectGuard;

        $this->assertTrue($guard->connectSucceeded(Util::CMD_ACK_OK));
        $this->assertTrue($guard->connectSucceeded(Util::CMD_ACK_AUTH));
        $this->assertFalse($guard->connectSucceeded(Util::CMD_ACK_UNAUTH));
        $this->assertFalse($guard->connectSucceeded(false));
    }
}
