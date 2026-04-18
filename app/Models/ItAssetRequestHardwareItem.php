<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItAssetRequestHardwareItem extends Model
{
    /** @use HasFactory<\Database\Factories\ItAssetRequestHardwareItemFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'it_asset_request_id',
        'hardware_id',
        'serial_number',
    ];

    public function itAssetRequest(): BelongsTo
    {
        return $this->belongsTo(ItAssetRequest::class);
    }

    public function hardware(): BelongsTo
    {
        return $this->belongsTo(Hardware::class);
    }
}
