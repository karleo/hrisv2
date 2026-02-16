<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $employee_code
 * @property string $first_name
 * @property string $last_name
 * @property string $email_address
 * @property string|null $contact_number
 * @property string|null $address_1
 * @property string|null $address_2
 * @property int $department_id
 * @property int $job_position_id
 * @property string|null $photo
 * @property string|null $company_name
 * @property string|null $company_address_1
 * @property string|null $company_address_2
 * @property string|null $company_website
 * @property string|null $company_logo
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Employee extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'employee_code',
        'first_name',
        'last_name',
        'email_address',
        'contact_number',
        'address_1',
        'address_2',
        'department_id',
        'job_position_id',
        'photo',
        'company_name',
        'company_address_1',
        'company_address_2',
        'company_website',
        'company_logo',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function jobPosition(): BelongsTo
    {
        return $this->belongsTo(JobPosition::class);
    }
}
