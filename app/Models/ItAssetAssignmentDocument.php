<?php

namespace App\Models;

use App\Support\PublicStorageUrl;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItAssetAssignmentDocument extends Model
{
    /** @use HasFactory<\Database\Factories\ItAssetAssignmentDocumentFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $appends = ['url'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'it_asset_assignment_id',
        'path',
        'original_name',
        'uploaded_by_user_id',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(ItAssetAssignment::class, 'it_asset_assignment_id');
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
