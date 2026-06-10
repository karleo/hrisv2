<?php

namespace App\Models;

use App\Services\Biometric\BiometricEmployeeMapper;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * @property int $id
 * @property int|null $user_id
 * @property string $employee_code
 * @property string $first_name
 * @property string $last_name
 * @property string $email_address
 * @property string|null $contact_number
 * @property string|null $address_1
 * @property string|null $address_2
 * @property int $department_id
 * @property int $job_position_id
 * @property string $role
 * @property string|null $photo
 * @property int|null $company_profile_id
 * @property int|null $work_timetable_id
 * @property \Illuminate\Support\Carbon|null $joining_date
 * @property \Illuminate\Support\Carbon|null $first_contract_date
 * @property \Illuminate\Support\Carbon|null $start_date
 * @property \Illuminate\Support\Carbon|null $end_date
 * @property string $employee_status
 * @property float $leave_opening_balance
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Employee extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    private const AUDIT_IGNORE_FIELDS = [
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'employee_code',
        'biometric_user_id',
        'first_name',
        'last_name',
        'email_address',
        'contact_number',
        'phone',
        'mobile',
        'date_of_birth',
        'gender',
        'marital_status',
        'emergency_contact_name',
        'emergency_contact_phone',
        'address_1',
        'address_2',
        'profile_address_1',
        'profile_address_2',
        'department_id',
        'job_position_id',
        'role',
        'photo',
        'company_profile_id',
        'work_timetable_id',
        'joining_date',
        'first_contract_date',
        'start_date',
        'end_date',
        'employee_status',
        'leave_opening_balance',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function managedDepartments(): HasMany
    {
        return $this->hasMany(Department::class, 'manager_employee_id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(EmployeeActivityLog::class)->orderByDesc('created_at');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(EmployeeMessage::class, 'sender_employee_id');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(EmployeeMessage::class, 'recipient_employee_id');
    }

    public function jobPosition(): BelongsTo
    {
        return $this->belongsTo(JobPosition::class);
    }

    public function companyProfile(): BelongsTo
    {
        return $this->belongsTo(CompanyProfile::class);
    }

    public function workTimetable(): BelongsTo
    {
        return $this->belongsTo(WorkTimetable::class);
    }

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date:Y-m-d',
            'joining_date' => 'date:Y-m-d',
            'first_contract_date' => 'date:Y-m-d',
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'leave_opening_balance' => 'float',
        ];
    }

    /**
     * @return HasMany<EmployeeTimeEntry, $this>
     */
    public function timeEntries(): HasMany
    {
        return $this->hasMany(EmployeeTimeEntry::class)->orderByDesc('clock_in_at');
    }

    public function hasUsableWorkTimetable(): bool
    {
        if ($this->work_timetable_id === null) {
            return false;
        }

        $this->loadMissing('workTimetable.days');

        return $this->workTimetable !== null
            && $this->workTimetable->days->count() === 7;
    }

    public function scheduleDayFor(DateTimeInterface $at): ?WorkTimetableDay
    {
        $this->loadMissing('workTimetable.days');
        if ($this->workTimetable === null) {
            return null;
        }

        $weekday = (int) Carbon::parse($at)->timezone(config('app.timezone'))->format('N');

        return $this->workTimetable->days->firstWhere('weekday', $weekday);
    }

    protected static function booted(): void
    {
        static::created(function (self $employee): void {
            $employee->recordAuditEntries(
                EmployeeActivityLog::ACTION_CREATED,
                $employee->auditLoggableValues(),
                []
            );

            if (trim((string) $employee->biometric_user_id) !== '') {
                app(BiometricEmployeeMapper::class)->mapForAllDevices();
            }
        });

        static::updated(function (self $employee): void {
            $changes = $employee->getChanges();
            unset($changes['updated_at']);
            if ($changes === []) {
                return;
            }

            $oldValues = [];
            foreach ($changes as $field => $_value) {
                $oldValues[$field] = $employee->getOriginal($field);
            }

            $employee->recordAuditEntries(
                EmployeeActivityLog::ACTION_UPDATED,
                $changes,
                $oldValues
            );

            if (array_key_exists('biometric_user_id', $changes)) {
                app(BiometricEmployeeMapper::class)->mapForAllDevices();
            }
        });

        static::deleted(function (self $employee): void {
            $employee->recordAuditEntries(
                EmployeeActivityLog::ACTION_DELETED,
                [],
                $employee->auditLoggableValues()
            );
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function auditLoggableValues(): array
    {
        $values = [];
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
                'employee_id' => $this->id,
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
            EmployeeActivityLog::query()->insert($rows);
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
