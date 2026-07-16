<?php

namespace App\Models;

use App\Support\PublicStorageUrl;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItAssetDocument extends Model
{
    /** @use HasFactory<\Database\Factories\ItAssetDocumentFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $appends = ['url'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'it_asset_id',
        'path',
        'original_name',
        'uploaded_by_user_id',
    ];

    public function itAsset(): BelongsTo
    {
        return $this->belongsTo(ItAsset::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    public function getUrlAttribute(): ?string
    {
        return PublicStorageUrl::forPath($this->path);
    }
}
