<?php

namespace App\Models;

use App\Enums\BiometricPunchDirection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $biometric_device_id
 * @property string $device_user_id
 * @property int|null $employee_id
 * @property \Illuminate\Support\Carbon $punched_at
 * @property BiometricPunchDirection $direction
 * @property int|null $verify_type
 * @property string|null $work_code
 * @property string $idempotency_key
 * @property \Illuminate\Support\Carbon|null $processed_at
 * @property int|null $biometric_attendance_session_id
 * @property array<string, mixed>|null $raw_payload
 */
class BiometricPunch extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'biometric_device_id',
        'device_user_id',
        'employee_id',
        'punched_at',
        'direction',
        'verify_type',
        'work_code',
        'idempotency_key',
        'processed_at',
        'biometric_attendance_session_id',
        'raw_payload',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'direction' => BiometricPunchDirection::class,
            'punched_at' => 'datetime',
            'processed_at' => 'datetime',
            'raw_payload' => 'array',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(BiometricDevice::class, 'biometric_device_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(BiometricAttendanceSession::class, 'biometric_attendance_session_id');
    }
}
