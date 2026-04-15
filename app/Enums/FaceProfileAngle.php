<?php

namespace App\Enums;

enum FaceProfileAngle: string
{
    case Front = 'front';
    case Left = 'left';
    case Right = 'right';

    /**
     * @return list<self>
     */
    public static function ordered(): array
    {
        return [self::Front, self::Left, self::Right];
    }

    public function label(): string
    {
        return match ($this) {
            self::Front => 'Front (straight on)',
            self::Left => 'Left profile',
            self::Right => 'Right profile',
        };
    }

    public function instruction(): string
    {
        return match ($this) {
            self::Front => 'Look straight at the camera with even lighting.',
            self::Left => 'Turn your head slowly to your left — keep your eyes toward the camera.',
            self::Right => 'Turn your head slowly to your right — keep your eyes toward the camera.',
        };
    }
}
