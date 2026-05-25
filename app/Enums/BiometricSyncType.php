<?php

namespace App\Enums;

enum BiometricSyncType: string
{
    case Manual = 'manual';
    case Scheduled = 'scheduled';
}
