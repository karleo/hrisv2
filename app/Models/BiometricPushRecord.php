<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiometricPushRecord extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'fingerprint',
        'device_serial',
        'employee_identifier',
        'punched_at',
        'raw_line',
    ];

    protected function casts(): array
    {
        return [
            'punched_at' => 'datetime',
        ];
    }
}
