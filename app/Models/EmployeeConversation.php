<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $employee_one_id
 * @property int $employee_two_id
 * @property int|null $last_message_id
 * @property \Illuminate\Support\Carbon|null $last_message_at
 */
class EmployeeConversation extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeConversationFactory> */
    use HasFactory;

    protected $fillable = [
        'employee_one_id',
        'employee_two_id',
        'last_message_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    public function employeeOne(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_one_id');
    }

    public function employeeTwo(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_two_id');
    }

    public function lastMessage(): BelongsTo
    {
        return $this->belongsTo(EmployeeMessage::class, 'last_message_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(EmployeeMessage::class, 'conversation_id');
    }

    public function scopeForEmployee(Builder $query, int $employeeId): Builder
    {
        return $query->where(function (Builder $query) use ($employeeId): void {
            $query
                ->where('employee_one_id', $employeeId)
                ->orWhere('employee_two_id', $employeeId);
        });
    }

    /**
     * @return array{0: int, 1: int}
     */
    public static function orderedEmployeePair(int $employeeAId, int $employeeBId): array
    {
        return $employeeAId < $employeeBId
            ? [$employeeAId, $employeeBId]
            : [$employeeBId, $employeeAId];
    }

    public function otherEmployeeId(int $employeeId): int
    {
        return $this->employee_one_id === $employeeId
            ? $this->employee_two_id
            : $this->employee_one_id;
    }
}
