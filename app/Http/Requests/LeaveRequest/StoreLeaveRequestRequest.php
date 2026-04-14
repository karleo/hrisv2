<?php

namespace App\Http\Requests\LeaveRequest;

use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveRequestRequest extends FormRequest
{
    private const FALLBACK_ABSENCE_TYPES = [
        'Personal Leave',
        'Sick Leave',
        'Maternity Leave',
        'Emergency Leave',
        'Annual Leave',
        'Others',
    ];

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('details') && $this->input('details') === '') {
            $this->merge(['details' => null]);
        }

        $periodFrom = $this->input('period_from');
        $periodTo = $this->input('period_to');

        $startDayType = strtolower((string) ($this->input('start_day_type') ?? ''));
        $endDayType = strtolower((string) ($this->input('end_day_type') ?? ''));

        $this->merge([
            'start_day_type' => $periodFrom ? ($startDayType !== '' ? $startDayType : 'full') : null,
            'end_day_type' => $periodTo ? ($endDayType !== '' ? $endDayType : 'full') : null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:'.Employee::class.',id'],
            'department_id' => ['required', 'integer', 'exists:'.Department::class.',id'],
            'absence_type' => ['required', 'string', Rule::in($this->allowedAbsenceTypes())],
            'absence_other' => ['nullable', 'string', 'max:255'],
            'details' => ['nullable', 'string', 'max:50', 'in:W/ medical Report,W/ Out medical Report'],
            'date' => ['nullable', 'date'],
            'period_from' => ['nullable', 'date', 'required_with:period_to'],
            'period_to' => ['nullable', 'date', 'required_with:period_from', 'after_or_equal:period_from'],
            'start_day_type' => ['nullable', 'string', Rule::in(['full', 'half'])],
            'end_day_type' => ['nullable', 'string', Rule::in(['full', 'half'])],
            'remarks' => ['nullable', 'string', 'max:65535'],
            'employee_signature_data_url' => ['nullable', 'string'],
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $type = $this->input('absence_type');

            if ($type === 'Others' && empty($this->input('absence_other'))) {
                $validator->errors()->add('absence_other', 'Please specify the other type of absence.');
            }

            if ($this->filled('start_day_type') && ! $this->filled('period_from')) {
                $validator->errors()->add('start_day_type', 'Start day type requires a period start date.');
            }

            if ($this->filled('end_day_type') && ! $this->filled('period_to')) {
                $validator->errors()->add('end_day_type', 'End day type requires a period end date.');
            }

            if (! $this->filled('period_from') || ! $this->filled('period_to')) {
                return;
            }

            $from = Carbon::parse((string) $this->input('period_from'));
            $to = Carbon::parse((string) $this->input('period_to'));
            $startDayType = (string) ($this->input('start_day_type') ?? 'full');
            $endDayType = (string) ($this->input('end_day_type') ?? 'full');

            $duration = (float) ($from->diffInDays($to) + 1);
            if ($from->isSameDay($to)) {
                $duration = $startDayType === 'half' || $endDayType === 'half' ? 0.5 : 1.0;
            } else {
                if ($startDayType === 'half') {
                    $duration -= 0.5;
                }
                if ($endDayType === 'half') {
                    $duration -= 0.5;
                }
            }

            if ($duration <= 0) {
                $validator->errors()->add('period_to', 'Computed leave duration must be greater than zero.');
            }
        });
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'period_to' => 'period end date',
            'start_day_type' => 'start day type',
            'end_day_type' => 'end day type',
        ];
    }

    /**
     * @return array<int, string>
     */
    private function allowedAbsenceTypes(): array
    {
        $leaveTypeNames = LeaveType::query()
            ->orderBy('name')
            ->pluck('name')
            ->filter(static fn ($name): bool => is_string($name) && $name !== '')
            ->values()
            ->all();

        return $leaveTypeNames !== [] ? $leaveTypeNames : self::FALLBACK_ABSENCE_TYPES;
    }
}
