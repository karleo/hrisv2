<?php

namespace App\Models;

use App\Support\DocumentCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $code
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
 * @property bool $ticket_booking
 * @property bool $passport_request
 * @property bool $ticket_encashment
 * @property bool $amount_2000
 * @property bool $amount_1000
 * @property string|null $leave_salary
 * @property string|null $passport_ack_airline_name
 * @property string|null $passport_ack_home_country
 * @property string|null $passport_ack_departure_date_time
 * @property string|null $passport_ack_home_country_departure_date_time
 * @property string|null $dept_head_signature
 * @property string|null $ceo_signature
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class EmployeeRequest extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeRequestFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (self $employeeRequest): void {
            if (! empty($employeeRequest->code)) {
                return;
            }

            $employeeRequest->code = DocumentCode::employeeRequest($employeeRequest->date);
        });
    }

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
        'ticket_booking',
        'passport_request',
        'ticket_encashment',
        'amount_2000',
        'amount_1000',
        'leave_salary',
        'passport_ack_airline_name',
        'passport_ack_home_country',
        'passport_ack_departure_date_time',
        'passport_ack_home_country_departure_date_time',
        'dept_head_signature',
        'ceo_signature',
        'employee_signature',
        'approved_by_signature',
        'approved_by_employee_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'code' => 'string',
            'date' => 'date:Y-m-d',
            'date_of_joining' => 'date:Y-m-d',
            'departure_date' => 'date:Y-m-d',
            'arrival_date' => 'date:Y-m-d',
            'last_encashment_date' => 'date:Y-m-d',
            'status' => 'string',
            'ticket_booking' => 'boolean',
            'passport_request' => 'boolean',
            'ticket_encashment' => 'boolean',
            'amount_2000' => 'boolean',
            'amount_1000' => 'boolean',
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

    public function approvedByEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'approved_by_employee_id');
    }
}
