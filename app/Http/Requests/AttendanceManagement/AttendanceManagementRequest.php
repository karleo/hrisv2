<?php

namespace App\Http\Requests\AttendanceManagement;

use App\Models\BiometricDevice;
use App\Models\CompanyProfile;
use App\Models\Employee;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class AttendanceManagementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'employee_id' => ['nullable', 'integer', Rule::exists(Employee::class, 'id')],
            'company_profile_id' => ['nullable', 'integer', Rule::exists(CompanyProfile::class, 'id')],
            'biometric_device_id' => ['nullable', 'integer', Rule::exists(BiometricDevice::class, 'id')],
            'source' => ['nullable', 'string', Rule::in(['all', 'biometric', 'manual', 'merged'])],
            'export' => ['nullable', 'in:csv,pdf'],
        ];
    }

    /**
     * @return array{from: string, to: string}
     */
    public function dateRange(): array
    {
        $to = $this->input('to') ?? now()->toDateString();
        $from = $this->input('from') ?? Carbon::parse($to)->subDays(30)->toDateString();

        return [
            'from' => $from,
            'to' => $to,
        ];
    }

    public function wantsCsvExport(): bool
    {
        return $this->input('export') === 'csv';
    }

    public function wantsPdfExport(): bool
    {
        return $this->input('export') === 'pdf';
    }
}
