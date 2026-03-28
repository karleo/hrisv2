<?php

namespace App\Enums;

enum AttendanceCheckInStatus: string
{
    case Early = 'early';
    case OnTime = 'on_time';
    case Late = 'late';
    case NotApplicable = 'not_applicable';

    public function label(): string
    {
        return match ($this) {
            self::Early => 'Early',
            self::OnTime => 'On time',
            self::Late => 'Late',
            self::NotApplicable => 'N/A',
        };
    }
}
