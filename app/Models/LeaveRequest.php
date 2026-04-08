<?php

namespace App\Models;

use App\Support\DocumentCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $code
 * @property int $employee_id
 * @property int $department_id
 * @property array<int, string> $absence_types
 * @property string|null $absence_other
 * @property string|null $details
 * @property string|null $date
 * @property string|null $period_from
 * @property string|null $period_to
 * @property int|null $days
 * @property string|null $remarks
 * @property string|null $decision_remarks
 * @property \Illuminate\Support\Carbon|null $decided_at
 * @property string $status
 * @property string|null $employee_signature
 * @property string|null $approved_by_signature
 * @property int|null $approved_by_employee_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class LeaveRequest extends Model
{
    /** @use HasFactory<\Database\Factories\LeaveRequestFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (self $leaveRequest): void {
            if (! empty($leaveRequest->code)) {
                return;
            }

            $leaveRequest->code = DocumentCode::leaveRequest($leaveRequest->date);
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'department_id',
        'absence_types',
        'absence_other',
        'details',
        'date',
        'period_from',
        'period_to',
        'days',
        'remarks',
        'decision_remarks',
        'decided_at',
        'status',
        'employee_signature',
        'approved_by_signature',
        'approved_by_employee_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'absence_types' => 'array',
            'code' => 'string',
            'status' => 'string',
            'decided_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function approvedByEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'approved_by_employee_id');
    }
}
