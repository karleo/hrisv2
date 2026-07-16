<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ItAssetAssignment extends Model
{
    /** @use HasFactory<\Database\Factories\ItAssetAssignmentFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'it_asset_id',
        'employee_id',
        'assigned_at',
        'returned_at',
        'assigned_by_user_id',
        'returned_by_user_id',
        'assignment_notes',
        'return_notes',
        'condition_on_return',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    public function itAsset(): BelongsTo
    {
        return $this->belongsTo(ItAsset::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    public function returnedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_by_user_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ItAssetAssignmentDocument::class);
    }
}
