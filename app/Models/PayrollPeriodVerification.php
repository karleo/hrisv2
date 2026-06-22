<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $company_profile_id
 * @property string $period_from
 * @property string $period_to
 * @property string $status
 * @property int|null $hr_verified_by
 * @property Carbon|null $hr_verified_at
 * @property string|null $hr_notes
 * @property int|null $finance_verified_by
 * @property Carbon|null $finance_verified_at
 * @property string|null $finance_notes
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class PayrollPeriodVerification extends Model
{
    public const string STATUS_PENDING_HR = 'pending_hr';

    public const string STATUS_PENDING_FINANCE = 'pending_finance';

    public const string STATUS_VERIFIED = 'verified';

    public const string STATUS_REOPENED = 'reopened';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'company_profile_id',
        'period_from',
        'period_to',
        'status',
        'hr_verified_by',
        'hr_verified_at',
        'hr_notes',
        'finance_verified_by',
        'finance_verified_at',
        'finance_notes',
    ];

    protected function casts(): array
    {
        return [
            'hr_verified_at' => 'datetime',
            'finance_verified_at' => 'datetime',
        ];
    }

    public function companyProfile(): BelongsTo
    {
        return $this->belongsTo(CompanyProfile::class);
    }

    public function hrVerifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hr_verified_by');
    }

    public function financeVerifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finance_verified_by');
    }

    public function payrollRuns(): HasMany
    {
        return $this->hasMany(PayrollRun::class);
    }

    public function isVerified(): bool
    {
        return $this->status === self::STATUS_VERIFIED;
    }

    public function isPendingHr(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING_HR, self::STATUS_REOPENED], true);
    }

    public function isPendingFinance(): bool
    {
        return $this->status === self::STATUS_PENDING_FINANCE;
    }
}
