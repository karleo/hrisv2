<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $employee_id
 * @property float $basic_salary
 * @property string $currency
 * @property string $pay_frequency
 * @property float $housing_allowance
 * @property float $transport_allowance
 * @property float $food_allowance
 * @property float $other_allowance
 * @property float $loan_deduction
 * @property float $other_deduction
 * @property float $overtime_rate_multiplier
 * @property string $overtime_rate_basis
 * @property float $overtime_standard_monthly_hours
 * @property string|null $bank_name
 * @property string|null $bank_account_number
 * @property string|null $iban
 * @property string|null $effective_from
 * @property string|null $notes
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class EmployeeCompensation extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeCompensationFactory> */
    use HasFactory;

    public const string OVERTIME_BASIS_PER_HOUR = 'per_hour';

    public const string OVERTIME_BASIS_PER_30_MINUTES = 'per_30_minutes';

    public const string OVERTIME_BASIS_PER_15_MINUTES = 'per_15_minutes';

    public const string OVERTIME_BASIS_PER_MINUTE = 'per_minute';

    protected $table = 'employee_compensations';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'basic_salary',
        'currency',
        'pay_frequency',
        'housing_allowance',
        'transport_allowance',
        'food_allowance',
        'other_allowance',
        'loan_deduction',
        'other_deduction',
        'overtime_rate_multiplier',
        'overtime_rate_basis',
        'overtime_standard_monthly_hours',
        'bank_name',
        'bank_account_number',
        'iban',
        'effective_from',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'basic_salary' => 'float',
            'housing_allowance' => 'float',
            'transport_allowance' => 'float',
            'food_allowance' => 'float',
            'other_allowance' => 'float',
            'loan_deduction' => 'float',
            'other_deduction' => 'float',
            'overtime_rate_multiplier' => 'float',
            'overtime_standard_monthly_hours' => 'float',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(EmployeeCompensationItem::class)->orderBy('sort_order');
    }

    public function allowances(): HasMany
    {
        return $this->hasMany(EmployeeCompensationItem::class)
            ->where('type', EmployeeCompensationItem::TYPE_ALLOWANCE)
            ->orderBy('sort_order');
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(EmployeeCompensationItem::class)
            ->where('type', EmployeeCompensationItem::TYPE_DEDUCTION)
            ->orderBy('sort_order');
    }

    public function grossSalary(): float
    {
        $this->loadMissing('items');

        $allowancesTotal = $this->items
            ->where('type', EmployeeCompensationItem::TYPE_ALLOWANCE)
            ->sum('amount');

        return $this->basic_salary + $allowancesTotal;
    }

    public function totalDeductions(): float
    {
        $this->loadMissing('items');

        return (float) $this->items
            ->where('type', EmployeeCompensationItem::TYPE_DEDUCTION)
            ->sum('amount');
    }

    public function netSalary(): float
    {
        return max(0.0, $this->grossSalary() - $this->totalDeductions());
    }

    public function overtimeBasisMinutes(): int
    {
        return match ($this->overtime_rate_basis) {
            self::OVERTIME_BASIS_PER_30_MINUTES => 30,
            self::OVERTIME_BASIS_PER_15_MINUTES => 15,
            self::OVERTIME_BASIS_PER_MINUTE => 1,
            default => 60,
        };
    }

    public function overtimeRatePerBasis(): float
    {
        $standardMinutes = max(1.0, $this->overtime_standard_monthly_hours * 60);
        $basisMinutes = $this->overtimeBasisMinutes();

        return ($this->basic_salary / $standardMinutes) * $basisMinutes;
    }

    public function calculateOvertimeAmount(int $overtimeMinutes): float
    {
        if ($overtimeMinutes <= 0) {
            return 0.0;
        }

        $basisMinutes = $this->overtimeBasisMinutes();
        $units = $overtimeMinutes / $basisMinutes;

        return round($this->overtimeRatePerBasis() * $units * $this->overtime_rate_multiplier, 2);
    }

    /**
     * Sync legacy aggregate columns from line items for payroll run snapshots.
     */
    public function syncLegacyAggregateColumns(): void
    {
        $this->loadMissing('items');

        $this->loadMissing('items.deductionType');

        $allowances = $this->items->where('type', EmployeeCompensationItem::TYPE_ALLOWANCE)->values();
        $deductions = $this->items->where('type', EmployeeCompensationItem::TYPE_DEDUCTION)->values();

        $loanDeductions = $deductions->filter(
            fn (EmployeeCompensationItem $item) => $item->deductionType?->behavior?->requiresPrincipal() ?? false
        );

        $standardDeductions = $deductions->reject(
            fn (EmployeeCompensationItem $item) => $item->deductionType?->behavior?->requiresPrincipal() ?? false
        );

        $this->forceFill([
            'housing_allowance' => (float) ($allowances->get(0)?->amount ?? 0),
            'transport_allowance' => (float) ($allowances->get(1)?->amount ?? 0),
            'food_allowance' => (float) ($allowances->get(2)?->amount ?? 0),
            'other_allowance' => (float) $allowances->skip(3)->sum('amount'),
            'loan_deduction' => (float) $loanDeductions->sum('amount'),
            'other_deduction' => (float) $standardDeductions->sum('amount'),
        ]);
    }
}
