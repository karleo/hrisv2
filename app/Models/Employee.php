<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use DateTimeInterface;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $user_id
 * @property string $employee_code
 * @property string $first_name
 * @property string $last_name
 * @property string $email_address
 * @property string|null $contact_number
 * @property string|null $address_1
 * @property string|null $address_2
 * @property int $department_id
 * @property int $job_position_id
 * @property string $role
 * @property string|null $photo
 * @property int|null $company_profile_id
 * @property int|null $work_timetable_id
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
        'user_id',
        'employee_code',
        'first_name',
        'last_name',
        'email_address',
        'contact_number',
        'phone',
        'mobile',
        'date_of_birth',
        'gender',
        'marital_status',
        'emergency_contact_name',
        'emergency_contact_phone',
        'address_1',
        'address_2',
        'profile_address_1',
        'profile_address_2',
        'department_id',
        'job_position_id',
        'role',
        'photo',
        'company_profile_id',
        'work_timetable_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function managedDepartments(): HasMany
    {
        return $this->hasMany(Department::class, 'manager_employee_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function jobPosition(): BelongsTo
    {
        return $this->belongsTo(JobPosition::class);
    }

    public function companyProfile(): BelongsTo
    {
        return $this->belongsTo(CompanyProfile::class);
    }

    public function workTimetable(): BelongsTo
    {
        return $this->belongsTo(WorkTimetable::class);
    }

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date:Y-m-d',
        ];
    }

    /**
     * @return HasMany<EmployeeTimeEntry, $this>
     */
    public function timeEntries(): HasMany
    {
        return $this->hasMany(EmployeeTimeEntry::class)->orderByDesc('clock_in_at');
    }

    public function hasUsableWorkTimetable(): bool
    {
        if ($this->work_timetable_id === null) {
            return false;
        }

        $this->loadMissing('workTimetable.days');

        return $this->workTimetable !== null
            && $this->workTimetable->days->count() === 7;
    }

    public function scheduleDayFor(DateTimeInterface $at): ?WorkTimetableDay
    {
        $this->loadMissing('workTimetable.days');
        if ($this->workTimetable === null) {
            return null;
        }

        $weekday = (int) Carbon::parse($at)->timezone(config('app.timezone'))->format('N');

        return $this->workTimetable->days->firstWhere('weekday', $weekday);
    }
}
