<?php

namespace App\Enums;

enum ItAssetStatus: string
{
    case Available = 'available';
    case Assigned = 'assigned';
    case InRepair = 'in_repair';
    case Retired = 'retired';
    case Lost = 'lost';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Available',
            self::Assigned => 'Assigned',
            self::InRepair => 'In repair',
            self::Retired => 'Retired',
            self::Lost => 'Lost',
        };
    }
}
