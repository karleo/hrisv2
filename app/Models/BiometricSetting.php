<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property bool $is_enabled
 * @property string|null $device_ip
 * @property int $device_port
 * @property string|null $comm_key
 * @property int $timeout_seconds
 * @property int $poll_interval_minutes
 * @property string $timezone
 * @property int $duplicate_window_seconds
 * @property int $max_pairing_hours
 * @property bool $treat_single_punch_as_open_entry
 * @property string $employee_identifier_field
 * @property string|null $location_name
 * @property \Illuminate\Support\Carbon|null $last_polled_at
 * @property string|null $last_log_cursor
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class BiometricSetting extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'is_enabled',
        'device_ip',
        'device_port',
        'comm_key',
        'timeout_seconds',
        'poll_interval_minutes',
        'timezone',
        'duplicate_window_seconds',
        'max_pairing_hours',
        'treat_single_punch_as_open_entry',
        'employee_identifier_field',
        'location_name',
        'last_polled_at',
        'last_log_cursor',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'treat_single_punch_as_open_entry' => 'boolean',
            'last_polled_at' => 'datetime',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate([], [
            'is_enabled' => false,
            'device_port' => 4370,
            'timeout_seconds' => 5,
            'poll_interval_minutes' => 5,
            'timezone' => (string) config('app.timezone', 'UTC'),
            'duplicate_window_seconds' => 45,
            'max_pairing_hours' => 16,
            'treat_single_punch_as_open_entry' => true,
            'employee_identifier_field' => 'employee_code',
        ]);
    }
}
