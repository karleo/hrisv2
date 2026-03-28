<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $work_timetable_id
 * @property int $weekday ISO: 1 = Monday … 7 = Sunday
 * @property bool $is_rest_day
 * @property string|null $work_starts_at
 * @property string|null $work_ends_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class WorkTimetableDay extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'work_timetable_id',
        'weekday',
        'is_rest_day',
        'work_starts_at',
        'work_ends_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
            'is_rest_day' => 'boolean',
        ];
    }

    public function workTimetable(): BelongsTo
    {
        return $this->belongsTo(WorkTimetable::class);
    }

    public function expectedMinutes(): int
    {
        if ($this->is_rest_day) {
            return 0;
        }

        $start = Carbon::parse($this->work_starts_at);
        $end = Carbon::parse($this->work_ends_at);

        return (int) $start->diffInMinutes($end);
    }

    /**
     * @return array<int, string>
     */
    public static function weekdayLabels(): array
    {
        return [
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday',
            7 => 'Sunday',
        ];
    }
}
