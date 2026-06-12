<?php

namespace App\Enums;

enum BiometricSessionAnomalyType: string
{
    case DuplicateIn = 'duplicate_in';
    case OrphanOut = 'orphan_out';
    case UnmappedPunch = 'unmapped_punch';
    case SessionAlreadyOpen = 'session_already_open';
}
