<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $payroll_run_employee_id
 * @property string $type
 * @property string $description
 * @property float $amount
 */
class PayrollLineItem extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'payroll_run_employee_id',
        'type',
        'description',
        'amount',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
        ];
    }

    public function payrollRunEmployee(): BelongsTo
    {
        return $this->belongsTo(PayrollRunEmployee::class);
    }
}
