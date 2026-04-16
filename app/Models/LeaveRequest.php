<?php

namespace App\Models;

use App\Support\DocumentCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

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
 * @property string $start_day_type
 * @property string $end_day_type
 * @property float|null $days
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

    /**
     * @var list<string>
     */
    private const AUDIT_IGNORE_FIELDS = [
        'created_at',
        'updated_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $leaveRequest): void {
            if (! empty($leaveRequest->code)) {
                return;
            }

            $leaveRequest->code = DocumentCode::leaveRequest($leaveRequest->date);
        });

        static::created(function (self $leaveRequest): void {
            $leaveRequest->recordAuditEntries(
                LeaveRequestActivityLog::ACTION_CREATED,
                $leaveRequest->auditLoggableValues(),
                []
            );
        });

        static::updated(function (self $leaveRequest): void {
            $changes = $leaveRequest->getChanges();
            unset($changes['updated_at']);
            if ($changes === []) {
                return;
            }

            $oldValues = [];
            foreach ($changes as $field => $_value) {
                $oldValues[$field] = $leaveRequest->getOriginal($field);
            }

            $leaveRequest->recordAuditEntries(
                LeaveRequestActivityLog::ACTION_UPDATED,
                $changes,
                $oldValues
            );
        });

        static::deleted(function (self $leaveRequest): void {
            $leaveRequest->recordAuditEntries(
                LeaveRequestActivityLog::ACTION_DELETED,
                [],
                $leaveRequest->auditLoggableValues()
            );
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
        'start_day_type',
        'period_to',
        'end_day_type',
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
            'days' => 'float',
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

    public function activityLogs(): HasMany
    {
        return $this->hasMany(LeaveRequestActivityLog::class)->orderByDesc('created_at');
    }

    /**
     * @return array<string, mixed>
     */
    private function auditLoggableValues(): array
    {
        $values = [
            'code' => $this->code,
        ];

        foreach ($this->getFillable() as $field) {
            if (in_array($field, self::AUDIT_IGNORE_FIELDS, true)) {
                continue;
            }

            $values[$field] = $this->getAttribute($field);
        }

        return $values;
    }

    /**
     * @param  array<string, mixed>  $newValues
     * @param  array<string, mixed>  $oldValues
     */
    private function recordAuditEntries(string $action, array $newValues, array $oldValues): void
    {
        $actor = Auth::user();
        $actorId = $actor?->id;
        $actorName = $actor?->name ?? $actor?->email ?? 'System';

        $fields = array_values(array_unique(array_merge(array_keys($newValues), array_keys($oldValues))));
        if ($fields === []) {
            return;
        }

        $rows = [];
        $now = now();
        foreach ($fields as $field) {
            if (in_array($field, self::AUDIT_IGNORE_FIELDS, true)) {
                continue;
            }

            $rows[] = [
                'leave_request_id' => $this->id,
                'actor_user_id' => $actorId,
                'actor_name' => $actorName,
                'action' => $action,
                'field_name' => $field,
                'old_value' => self::normalizeAuditValue($oldValues[$field] ?? null),
                'new_value' => self::normalizeAuditValue($newValues[$field] ?? null),
                'created_at' => $now,
            ];
        }

        if ($rows !== []) {
            LeaveRequestActivityLog::query()->insert($rows);
        }
    }

    private static function normalizeAuditValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->toDateTimeString();
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if (is_array($value)) {
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            return $encoded === false ? '[unserializable]' : $encoded;
        }

        if (is_scalar($value)) {
            return (string) $value;
        }

        return '[unserializable]';
    }
}
