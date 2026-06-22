<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $payroll_run_id
 * @property int $employee_id
 * @property int|null $employee_compensation_id
 * @property float $basic_salary
 * @property float $housing_allowance
 * @property float $transport_allowance
 * @property float $food_allowance
 * @property float $other_allowance
 * @property int $overtime_minutes
 * @property float $overtime_rate_multiplier
 * @property float $overtime_amount
 * @property float $loan_deduction
 * @property float $other_deduction
 * @property float $gross_salary
 * @property float $total_deductions
 * @property float $net_salary
 */
class PayrollRunEmployee extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'payroll_run_id',
        'employee_id',
        'employee_compensation_id',
        'basic_salary',
        'housing_allowance',
        'transport_allowance',
        'food_allowance',
        'other_allowance',
        'overtime_minutes',
        'overtime_rate_multiplier',
        'overtime_amount',
        'loan_deduction',
        'other_deduction',
        'gross_salary',
        'total_deductions',
        'net_salary',
    ];

    protected function casts(): array
    {
        return [
            'basic_salary' => 'float',
            'housing_allowance' => 'float',
            'transport_allowance' => 'float',
            'food_allowance' => 'float',
            'other_allowance' => 'float',
            'overtime_amount' => 'float',
            'loan_deduction' => 'float',
            'other_deduction' => 'float',
            'gross_salary' => 'float',
            'total_deductions' => 'float',
            'net_salary' => 'float',
        ];
    }

    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function compensation(): BelongsTo
    {
        return $this->belongsTo(EmployeeCompensation::class, 'employee_compensation_id');
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(PayrollLineItem::class);
    }
}
