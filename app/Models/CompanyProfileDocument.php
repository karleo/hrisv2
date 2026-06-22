<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $company_profile_id
 * @property int|null $document_type_id
 * @property string $name
 * @property string $path
 * @property string $original_name
 * @property \Illuminate\Support\Carbon|null $expiry_date
 * @property string $status
 * @property int $version_number
 * @property \Illuminate\Support\Carbon|null $archived_at
 * @property int|null $replaces_document_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property string $url
 */
class CompanyProfileDocument extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyProfileDocumentFactory> */
    use HasFactory;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_ARCHIVED = 'archived';

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = ['url'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_profile_id',
        'document_type_id',
        'name',
        'path',
        'original_name',
        'expiry_date',
        'status',
        'version_number',
        'archived_at',
        'replaces_document_id',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date:Y-m-d',
            'archived_at' => 'datetime',
            'version_number' => 'integer',
        ];
    }

    public function companyProfile(): BelongsTo
    {
        return $this->belongsTo(CompanyProfile::class);
    }

    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function previousVersion(): BelongsTo
    {
        return $this->belongsTo(self::class, 'replaces_document_id');
    }

    public function nextVersions(): HasMany
    {
        return $this->hasMany(self::class, 'replaces_document_id')->orderByDesc('version_number');
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeExpired(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_EXPIRED);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ARCHIVED);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED;
    }

    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }

    public function getUrlAttribute(): string
    {
        return '/storage/'.ltrim($this->path, '/');
    }
}
