<?php

namespace App\Services\Biometric;

use App\Contracts\Biometric\BiometricDeviceConnector;
use App\Enums\BiometricConnectionType;
use App\Models\BiometricDevice;
use App\Services\Biometric\Connectors\AdmsPushConnector;
use App\Services\Biometric\Connectors\ZkDeviceWebReportPullConnector;
use App\Services\Biometric\Connectors\ZkTecoTcpPullConnector;

class BiometricConnectorFactory
{
    public function __construct(
        private readonly ZkTecoTcpPullConnector $tcpPullConnector,
        private readonly AdmsPushConnector $admsPushConnector,
        private readonly ZkDeviceWebReportPullConnector $deviceWebReportConnector,
    ) {}

    public function forDevice(BiometricDevice $device): BiometricDeviceConnector
    {
        return match ($device->connection_type) {
            BiometricConnectionType::TcpPull => $this->tcpPullConnector,
            BiometricConnectionType::AdmsPush => $this->admsPushConnector,
            BiometricConnectionType::DeviceWebReport => $this->deviceWebReportConnector,
        };
    }
}
