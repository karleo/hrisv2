<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class WorkTimetable extends Model
{
    /** @use HasFactory<\Database\Factories\WorkTimetableFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
    ];

    /**
     * @return HasMany<WorkTimetableDay, $this>
     */
    public function days(): HasMany
    {
        return $this->hasMany(WorkTimetableDay::class)->orderBy('weekday');
    }

    public function hasCompleteWeek(): bool
    {
        return $this->days()->count() === 7;
    }

    /**
     * @return HasMany<Employee, $this>
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
