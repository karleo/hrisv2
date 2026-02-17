<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $employee_id
 * @property int $job_position_id
 * @property int $department_id
 * @property string $date
 * @property string $date_of_joining
 * @property string $status
 * @property string|null $departure_date
 * @property string|null $arrival_date
 * @property string|null $preferred_airlines
 * @property string|null $last_encashment_date
 * @property string|null $bag_allowance
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class EmployeeRequest extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeRequestFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'job_position_id',
        'department_id',
        'date',
        'date_of_joining',
        'status',
        'departure_date',
        'arrival_date',
        'preferred_airlines',
        'last_encashment_date',
        'bag_allowance',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'date_of_joining' => 'date:Y-m-d',
            'departure_date' => 'date:Y-m-d',
            'arrival_date' => 'date:Y-m-d',
            'last_encashment_date' => 'date:Y-m-d',
            'status' => 'string',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function jobPosition(): BelongsTo
    {
        return $this->belongsTo(JobPosition::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}

