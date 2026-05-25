<?php

namespace App\Enums;

enum BiometricSyncStatus: string
{
    case Running = 'running';
    case Completed = 'completed';
    case Failed = 'failed';
}
