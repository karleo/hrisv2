<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $employee_id
 * @property int|null $biometric_device_id
 * @property \Illuminate\Support\Carbon $clock_in_at
 * @property \Illuminate\Support\Carbon|null $clock_out_at
 * @property int|null $clock_in_punch_id
 * @property int|null $clock_out_punch_id
 * @property int|null $working_minutes
 * @property bool $is_open
 */
class BiometricAttendanceSession extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'biometric_device_id',
        'clock_in_at',
        'clock_out_at',
        'clock_in_punch_id',
        'clock_out_punch_id',
        'working_minutes',
        'is_open',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'clock_in_at' => 'datetime',
            'clock_out_at' => 'datetime',
            'is_open' => 'boolean',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(BiometricDevice::class, 'biometric_device_id');
    }

    public function clockInPunch(): BelongsTo
    {
        return $this->belongsTo(BiometricPunch::class, 'clock_in_punch_id');
    }

    public function clockOutPunch(): BelongsTo
    {
        return $this->belongsTo(BiometricPunch::class, 'clock_out_punch_id');
    }

    public function punches(): HasMany
    {
        return $this->hasMany(BiometricPunch::class, 'biometric_attendance_session_id');
    }
}
