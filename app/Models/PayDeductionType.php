<?php

namespace App\Models;

use App\Enums\PayDeductionBehavior;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $code
 * @property string $name
 * @property PayDeductionBehavior $behavior
 * @property string|null $description
 * @property bool $is_active
 * @property int $sort_order
 */
class PayDeductionType extends Model
{
    /** @use HasFactory<\Database\Factories\PayDeductionTypeFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
        'behavior',
        'description',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'behavior' => PayDeductionBehavior::class,
            'is_active' => 'boolean',
        ];
    }

    public function compensationItems(): HasMany
    {
        return $this->hasMany(EmployeeCompensationItem::class);
    }

    public function requiresPrincipal(): bool
    {
        return $this->behavior->requiresPrincipal();
    }
}
