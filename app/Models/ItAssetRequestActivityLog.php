<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItAssetRequestActivityLog extends Model
{
    public const ACTION_CREATED = 'created';

    public const ACTION_UPDATED = 'updated';

    public const ACTION_DELETED = 'deleted';

    public $timestamps = false;

    protected $fillable = [
        'it_asset_request_id',
        'actor_user_id',
        'actor_name',
        'action',
        'field_name',
        'old_value',
        'new_value',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function itAssetRequest(): BelongsTo
    {
        return $this->belongsTo(ItAssetRequest::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
