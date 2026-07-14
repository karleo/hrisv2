<?php

namespace App\Services\Biometric;

use Mithun\PhpZkteco\Libs\Services\Util;
use Mithun\PhpZkteco\Libs\ZKTeco;

final class ZkTecoConnectGuard
{
    /**
     * php-zkteco Connect::connect() returns CMD_* integers, but ZKTeco::connect()
     * declares a bool return type so PHP coerces CMD_ACK_OK to true.
     */
    public function connectSucceeded(mixed $result): bool
    {
        return $result === true
            || $result === Util::CMD_ACK_OK
            || $result === Util::CMD_ACK_AUTH;
    }

    public function connect(ZKTeco $zk): bool
    {
        return $this->connectSucceeded($zk->connect());
    }
}
