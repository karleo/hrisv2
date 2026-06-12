<?php

namespace App\Enums;

// Work mode options for employee time entries
enum AttendanceWorkMode: string
{
    // Employee works from home
    case WorkFromHome = 'work_from_home';

    // Employee works in the field as a driver
    case FieldDriver = 'field_driver';

    // Employee works in the field as a sales representative
    case FieldSales = 'field_sales';

    /**
     * Human-readable label for the work mode.
     */
    public function label(): string
    {
        return match ($this) {
            self::WorkFromHome => 'Work from Home',
            self::FieldDriver => 'Field – Driver',
            self::FieldSales => 'Field – Sales',
        };
    }

    /**
     * Whether this mode requires photo and GPS evidence at check-in and check-out.
     */
    public function isField(): bool
    {
        return match ($this) {
            self::FieldDriver, self::FieldSales => true,
            default => false,
        };
    }

    /**
     * All values as a comma-separated string for validation rules.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
