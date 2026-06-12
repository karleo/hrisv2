<?php

namespace App\Models;

use App\Support\DocumentCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class ItAssetRequest extends Model
{
    /** @use HasFactory<\Database\Factories\ItAssetRequestFactory> */
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
        static::creating(function (self $itAssetRequest): void {
            if (! empty($itAssetRequest->code)) {
                return;
            }

            $itAssetRequest->code = DocumentCode::itAssetRequest($itAssetRequest->date);
        });

        static::created(function (self $itAssetRequest): void {
            $itAssetRequest->recordAuditEntries(
                ItAssetRequestActivityLog::ACTION_CREATED,
                $itAssetRequest->auditLoggableValues(),
                []
            );
        });

        static::updated(function (self $itAssetRequest): void {
            $changes = $itAssetRequest->getChanges();
            unset($changes['updated_at']);
            if ($changes === []) {
                return;
            }

            $oldValues = [];
            foreach ($changes as $field => $_value) {
                $oldValues[$field] = $itAssetRequest->getOriginal($field);
            }

            $itAssetRequest->recordAuditEntries(
                ItAssetRequestActivityLog::ACTION_UPDATED,
                $changes,
                $oldValues
            );
        });

        static::deleted(function (self $itAssetRequest): void {
            $itAssetRequest->recordAuditEntries(
                ItAssetRequestActivityLog::ACTION_DELETED,
                [],
                $itAssetRequest->auditLoggableValues()
            );
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'department_id',
        'date',
        'date_issued',
        'hardware_ids',
        'asset_type',
        'serial_number',
        'remarks',
        'decision_remarks',
        'decided_at',
        'status',
        'employee_signature',
        'issued_by_signature',
        'issued_by_employee_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'code' => 'string',
            'date' => 'date:Y-m-d',
            'date_issued' => 'date:Y-m-d',
            'hardware_ids' => 'array',
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

    public function issuedByEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'issued_by_employee_id');
    }

    public function hardwareItems(): HasMany
    {
        return $this->hasMany(ItAssetRequestHardwareItem::class)
            ->orderBy('id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ItAssetRequestActivityLog::class)->orderByDesc('created_at');
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
                'it_asset_request_id' => $this->id,
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
            ItAssetRequestActivityLog::query()->insert($rows);
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
