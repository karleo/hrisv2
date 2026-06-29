<?php

namespace App\Enums;

enum ItAssetEventType: string
{
    case Created = 'created';
    case Assigned = 'assigned';
    case Returned = 'returned';
    case StatusChanged = 'status_changed';
    case Updated = 'updated';
    case Deleted = 'deleted';

    public function label(): string
    {
        return match ($this) {
            self::Created => 'Created',
            self::Assigned => 'Assigned',
            self::Returned => 'Returned',
            self::StatusChanged => 'Status changed',
            self::Updated => 'Updated',
            self::Deleted => 'Deleted',
        };
    }
}
