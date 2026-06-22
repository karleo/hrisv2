<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string|null $logo
 * @property string|null $business_card_logo
 * @property string|null $business_card_back_logo_1
 * @property string|null $business_card_back_logo_2
 * @property string|null $business_card_back_logo_3
 * @property string|null $business_card_back_logo_4
 * @property string $company_name
 * @property string|null $company_address_1
 * @property string|null $company_address_2
 * @property int|null $country_id
 * @property string|null $website
 * @property string|null $signature_template
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
        'business_card_logo',
        'business_card_back_logo_1',
        'business_card_back_logo_2',
        'business_card_back_logo_3',
        'business_card_back_logo_4',
        'company_name',
        'company_address_1',
        'company_address_2',
        'country_id',
        'website',
        'signature_template',
    ];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CompanyProfileDocument::class)->orderByDesc('created_at');
    }
}
