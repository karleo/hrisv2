<?php

namespace App\Models;

use App\Enums\ItAssetCategory;
use App\Enums\ItAssetStatus;
use App\Support\DocumentCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class ItAsset extends Model
{
    /** @use HasFactory<\Database\Factories\ItAssetFactory> */
    use HasFactory;

    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'category',
        'name',
        'status',
        'hardware_id',
        'hardware_asset_value_id',
        'software_id',
        'accessory_id',
        'serial_number',
        'asset_tag',
        'license_key',
        'license_seats',
        'expiry_date',
        'purchase_date',
        'warranty_expires_at',
        'asset_value',
        'asset_currency',
        'condition_notes',
        'remarks',
        'current_employee_id',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $asset): void {
            if (! empty($asset->code)) {
                return;
            }

            $asset->code = DocumentCode::itAsset();
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => ItAssetCategory::class,
            'status' => ItAssetStatus::class,
            'license_seats' => 'integer',
            'expiry_date' => 'date:Y-m-d',
            'purchase_date' => 'date:Y-m-d',
            'warranty_expires_at' => 'date:Y-m-d',
            'asset_value' => 'decimal:2',
        ];
    }

    public function hardware(): BelongsTo
    {
        return $this->belongsTo(Hardware::class);
    }

    public function hardwareAssetValue(): BelongsTo
    {
        return $this->belongsTo(HardwareAssetValue::class);
    }

    public function software(): BelongsTo
    {
        return $this->belongsTo(Software::class);
    }

    public function accessory(): BelongsTo
    {
        return $this->belongsTo(Accessory::class);
    }

    public function currentEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'current_employee_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ItAssetAssignment::class)->orderByDesc('assigned_at');
    }

    public function activeAssignment(): HasOne
    {
        return $this->hasOne(ItAssetAssignment::class)->whereNull('returned_at')->latestOfMany('assigned_at');
    }

    public function events(): HasMany
    {
        return $this->hasMany(ItAssetEvent::class)->orderByDesc('created_at');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ItAssetDocument::class)->orderByDesc('created_at');
    }

    public function catalogName(): string
    {
        return match ($this->category) {
            ItAssetCategory::Hardware => (string) ($this->hardware?->name ?? $this->name),
            ItAssetCategory::Software => (string) ($this->software?->name ?? $this->name),
            ItAssetCategory::Accessory => (string) ($this->accessory?->name ?? $this->name),
        };
    }

    public function identifier(): ?string
    {
        return match ($this->category) {
            ItAssetCategory::Hardware, ItAssetCategory::Accessory => $this->serial_number ?? $this->asset_tag,
            ItAssetCategory::Software => $this->license_key,
        };
    }
}
