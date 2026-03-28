<?php

namespace App\Enums;

enum ModuleAbility: string
{
    case Access = 'access';
    case View = 'view';
    case Create = 'create';
    case Update = 'update';
    case Delete = 'delete';
    case CheckIn = 'check_in';
    case CheckOut = 'check_out';
}
