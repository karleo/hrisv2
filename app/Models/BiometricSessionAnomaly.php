<?php

namespace App\Models;

use App\Enums\BiometricSessionAnomalyType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $biometric_punch_id
 * @property int|null $employee_id
 * @property int|null $biometric_device_id
 * @property BiometricSessionAnomalyType $type
 * @property string $message
 * @property array<string, mixed>|null $context
 */
class BiometricSessionAnomaly extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'biometric_punch_id',
        'employee_id',
        'biometric_device_id',
        'type',
        'message',
        'context',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => BiometricSessionAnomalyType::class,
            'context' => 'array',
        ];
    }

    public function punch(): BelongsTo
    {
        return $this->belongsTo(BiometricPunch::class, 'biometric_punch_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(BiometricDevice::class, 'biometric_device_id');
    }
}
