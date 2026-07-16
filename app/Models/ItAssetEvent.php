<?php

namespace App\Models;

use App\Enums\ItAssetEventType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItAssetEvent extends Model
{
    /** @use HasFactory<\Database\Factories\ItAssetEventFactory> */
    use HasFactory;

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'it_asset_id',
        'it_asset_assignment_id',
        'event_type',
        'actor_user_id',
        'actor_name',
        'metadata',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'event_type' => ItAssetEventType::class,
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function itAsset(): BelongsTo
    {
        return $this->belongsTo(ItAsset::class);
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(ItAssetAssignment::class, 'it_asset_assignment_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
