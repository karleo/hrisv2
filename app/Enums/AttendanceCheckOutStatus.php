<?php

namespace App\Enums;

enum AttendanceCheckOutStatus: string
{
    case EarlyLeave = 'early_leave';
    case OnTime = 'on_time';
    case Overtime = 'overtime';
    case NotApplicable = 'not_applicable';

    public function label(): string
    {
        return match ($this) {
            self::EarlyLeave => 'Left early',
            self::OnTime => 'On time',
            self::Overtime => 'Overtime',
            self::NotApplicable => 'N/A',
        };
    }
}
