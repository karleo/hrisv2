<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string|null $logo
 * @property string $company_name
 * @property string|null $company_address_1
 * @property string|null $company_address_2
 * @property int|null $country_id
 * @property string|null $website
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class CompanyProfile extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyProfileFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'logo',
        'company_name',
        'company_address_1',
        'company_address_2',
        'country_id',
        'website',
    ];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }
}
