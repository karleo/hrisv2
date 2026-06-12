<?php

namespace App\Services\Biometric;

use Mithun\PhpZkteco\Libs\Services\Util;
use Mithun\PhpZkteco\Libs\ZKTeco;

final class ZkTecoConnectGuard
{
    /**
     * php-zkteco connect() returns CMD_* integers, not boolean true.
     */
    public function connectSucceeded(mixed $result): bool
    {
        return $result === Util::CMD_ACK_OK || $result === Util::CMD_ACK_AUTH;
    }

    public function connect(ZKTeco $zk): bool
    {
        return $this->connectSucceeded($zk->connect());
    }
}
