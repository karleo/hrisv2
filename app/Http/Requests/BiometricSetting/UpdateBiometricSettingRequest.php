<?php

namespace App\Http\Requests\BiometricSetting;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBiometricSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::Update);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'is_enabled' => ['required', 'boolean'],
            'device_ip' => ['nullable', 'ip'],
            'device_port' => ['required', 'integer', 'between:1,65535'],
            'comm_key' => ['nullable', 'string', 'max:255'],
            'timeout_seconds' => ['required', 'integer', 'between:1,60'],
            'poll_interval_minutes' => ['required', 'integer', 'between:1,1440'],
            'timezone' => ['required', 'timezone'],
            'duplicate_window_seconds' => ['required', 'integer', 'between:0,600'],
            'max_pairing_hours' => ['required', 'integer', 'between:1,48'],
            'treat_single_punch_as_open_entry' => ['required', 'boolean'],
            'employee_identifier_field' => ['required', Rule::in(['employee_code', 'id'])],
            'location_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
