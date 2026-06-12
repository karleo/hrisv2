<?php

namespace App\Models;

use App\Enums\BiometricSyncStatus;
use App\Enums\BiometricSyncType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $biometric_device_id
 * @property int|null $triggered_by
 * @property BiometricSyncType $sync_type
 * @property BiometricSyncStatus $status
 * @property \Illuminate\Support\Carbon $started_at
 * @property \Illuminate\Support\Carbon|null $finished_at
 * @property int $fetched_count
 * @property int $inserted_count
 * @property int $duplicate_count
 * @property int $unmapped_count
 * @property int $failed_count
 * @property int $sessions_created_count
 * @property int $sessions_updated_count
 * @property string|null $error_message
 * @property array<string, mixed>|null $error_metadata
 */
class BiometricSyncLog extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'biometric_device_id',
        'triggered_by',
        'sync_type',
        'status',
        'started_at',
        'finished_at',
        'fetched_count',
        'inserted_count',
        'duplicate_count',
        'unmapped_count',
        'failed_count',
        'sessions_created_count',
        'sessions_updated_count',
        'error_message',
        'error_metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sync_type' => BiometricSyncType::class,
            'status' => BiometricSyncStatus::class,
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'error_metadata' => 'array',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(BiometricDevice::class, 'biometric_device_id');
    }

    public function triggeredByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }
}
