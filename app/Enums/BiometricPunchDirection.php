<?php

namespace App\Enums;

enum BiometricPunchDirection: string
{
    case In = 'in';
    case Out = 'out';
    case Unknown = 'unknown';
}
