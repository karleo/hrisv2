<?php

namespace App\Enums;

enum ItAssetCategory: string
{
    case Hardware = 'hardware';
    case Software = 'software';
    case Accessory = 'accessory';

    public function label(): string
    {
        return match ($this) {
            self::Hardware => 'Devices',
            self::Software => 'Software',
            self::Accessory => 'Accessory',
        };
    }
}
