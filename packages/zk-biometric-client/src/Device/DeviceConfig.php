<?php

namespace PrimeLogistics\ZkBiometricClient\Device;

final class DeviceConfig
{
    public function __construct(
        public readonly string $host,
        public readonly string $serialNumber,
        public readonly string $timezone = 'Asia/Dubai',
        public readonly int $port = 80,
        public readonly string $username = 'administrator',
        public readonly string $password = '',
        public readonly ?string $webSessionId = null,
        public readonly int $timeoutSeconds = 30,
    ) {}

    public function baseUrl(): string
    {
        $host = trim($this->host);

        if (str_starts_with($host, 'http://') || str_starts_with($host, 'https://')) {
            return rtrim($host, '/');
        }

        $port = $this->port > 0 && $this->port !== 80 ? ':'.$this->port : '';

        return 'http://'.$host.$port;
    }
}
