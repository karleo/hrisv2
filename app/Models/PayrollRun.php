<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $company_profile_id
 * @property int $payroll_period_verification_id
 * @property string $status
 * @property string $currency
 * @property float $total_gross
 * @property float $total_deductions
 * @property float $total_net
 * @property string|null $notes
 * @property int|null $approved_by
 * @property Carbon|null $approved_at
 * @property Carbon|null $paid_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class PayrollRun extends Model
{
    public const string STATUS_DRAFT = 'draft';

    public const string STATUS_REVIEW = 'review';

    public const string STATUS_APPROVED = 'approved';

    public const string STATUS_PAID = 'paid';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'company_profile_id',
        'payroll_period_verification_id',
        'status',
        'currency',
        'total_gross',
        'total_deductions',
        'total_net',
        'notes',
        'approved_by',
        'approved_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'total_gross' => 'float',
            'total_deductions' => 'float',
            'total_net' => 'float',
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function periodVerification(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriodVerification::class, 'payroll_period_verification_id');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(PayrollRunEmployee::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isReview(): bool
    {
        return $this->status === self::STATUS_REVIEW;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_REVIEW], true);
    }
}
