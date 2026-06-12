<?php

namespace App\Models;

use App\Enums\AttendanceWorkMode;
use App\Services\AttendanceClassificationService;
use App\Services\AttendanceDurationService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $employee_id
 * @property \Illuminate\Support\Carbon $clock_in_at
 * @property \Illuminate\Support\Carbon|null $clock_out_at
 * @property string|null $daily_summary
 * @property string|null $work_mode
 * @property string|null $check_in_remarks
 * @property string|null $check_in_photo_path
 * @property float|null $check_in_latitude
 * @property float|null $check_in_longitude
 * @property string|null $check_out_remarks
 * @property string|null $check_out_photo_path
 * @property float|null $check_out_latitude
 * @property float|null $check_out_longitude
 * @property int|null $worked_minutes
 * @property int|null $overtime_minutes
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
        'work_mode',
        'check_in_remarks',
        'check_in_photo_path',
        'check_in_latitude',
        'check_in_longitude',
        'check_out_remarks',
        'check_out_photo_path',
        'check_out_latitude',
        'check_out_longitude',
        'worked_minutes',
        'overtime_minutes',
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
            'check_in_latitude' => 'float',
            'check_in_longitude' => 'float',
            'check_out_latitude' => 'float',
            'check_out_longitude' => 'float',
            'work_mode' => AttendanceWorkMode::class,
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Compute the raw number of worked minutes from clock times (not the persisted column).
     */
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

    /**
     * Whether this entry requires photographic and GPS evidence on both check-in and check-out.
     */
    public function requiresFieldEvidence(): bool
    {
        return $this->work_mode instanceof AttendanceWorkMode && $this->work_mode->isField();
    }

    /**
     * Convenience accessor for the work mode label.
     */
    public function workModeLabel(): string
    {
        if (! $this->work_mode instanceof AttendanceWorkMode) {
            return '—';
        }

        return $this->work_mode->label();
    }

    /**
     * Calculate and store worked_minutes and overtime_minutes on this model instance.
     * Caller must still save() the model after calling this.
     */
    public function calculateAndPersistWorkedTime(AttendanceDurationService $service): void
    {
        if ($this->clock_out_at === null) {
            return;
        }

        $this->loadMissing('employee.workTimetable.days');

        // Calculate raw duration
        $worked = $service->workedMinutes($this->clock_in_at, $this->clock_out_at);
        $this->worked_minutes = $worked;

        // Calculate overtime against the employee timetable if available
        if ($this->employee !== null) {
            $this->overtime_minutes = $service->overtimeMinutes($this->employee, $this->clock_in_at, $worked);
        } else {
            $this->overtime_minutes = 0;
        }
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
