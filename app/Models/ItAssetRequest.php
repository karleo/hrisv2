<?php

namespace App\Models;

use App\Support\DocumentCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItAssetRequest extends Model
{
    /** @use HasFactory<\Database\Factories\ItAssetRequestFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (self $itAssetRequest): void {
            if (! empty($itAssetRequest->code)) {
                return;
            }

            $itAssetRequest->code = DocumentCode::itAssetRequest($itAssetRequest->date);
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
}
