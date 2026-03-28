<?php

namespace App\Models;

use App\Services\AttendanceClassificationService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $employee_id
 * @property \Illuminate\Support\Carbon $clock_in_at
 * @property \Illuminate\Support\Carbon|null $clock_out_at
 * @property string|null $daily_summary
 * @property string|null $check_in_status
 * @property string|null $check_out_status
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class EmployeeTimeEntry extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'clock_in_at',
        'clock_out_at',
        'daily_summary',
        'check_in_status',
        'check_out_status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'clock_in_at' => 'datetime',
            'clock_out_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function workedMinutes(): ?int
    {
        if ($this->clock_out_at === null) {
            return null;
        }

        $seconds = $this->clock_in_at->diffInSeconds($this->clock_out_at);
        if ($seconds <= 0) {
            return 0;
        }

        return (int) ceil($seconds / 60);
    }

    public function isOpen(): bool
    {
        return $this->clock_out_at === null;
    }

    public function recalculateAttendanceStatuses(AttendanceClassificationService $service): void
    {
        $this->loadMissing('employee.workTimetable.days');
        $employee = $this->employee;
        $inDay = $employee?->scheduleDayFor($this->clock_in_at);
        $this->check_in_status = $service->classifyCheckIn($this->clock_in_at, $inDay)->value;
        if ($this->clock_out_at !== null) {
            $outDay = $employee?->scheduleDayFor($this->clock_out_at);
            $this->check_out_status = $service->classifyCheckOut($this->clock_out_at, $outDay)->value;
        } else {
            $this->check_out_status = null;
        }
    }
}
