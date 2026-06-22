<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $employee_compensation_id
 * @property string $type
 * @property int|null $pay_allowance_type_id
 * @property int|null $pay_deduction_type_id
 * @property string $name
 * @property float $amount
 * @property float|null $principal_amount
 * @property float|null $remaining_balance
 * @property int $sort_order
 */
class EmployeeCompensationItem extends Model
{
    public const string TYPE_ALLOWANCE = 'allowance';

    public const string TYPE_DEDUCTION = 'deduction';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'employee_compensation_id',
        'type',
        'pay_allowance_type_id',
        'pay_deduction_type_id',
        'name',
        'amount',
        'principal_amount',
        'remaining_balance',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'principal_amount' => 'float',
            'remaining_balance' => 'float',
        ];
    }

    public function compensation(): BelongsTo
    {
        return $this->belongsTo(EmployeeCompensation::class, 'employee_compensation_id');
    }

    public function allowanceType(): BelongsTo
    {
        return $this->belongsTo(PayAllowanceType::class, 'pay_allowance_type_id');
    }

    public function deductionType(): BelongsTo
    {
        return $this->belongsTo(PayDeductionType::class, 'pay_deduction_type_id');
    }
}
