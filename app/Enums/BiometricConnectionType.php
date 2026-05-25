<?php

namespace App\Enums;

enum BiometricConnectionType: string
{
    case TcpPull = 'tcp_pull';
    case AdmsPush = 'adms_push';
    case DeviceWebReport = 'device_web_report';
}
