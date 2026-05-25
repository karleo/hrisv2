<?php

namespace App\Http\Requests\Biometric;

use App\Enums\BiometricConnectionType;
use App\Models\BiometricDevice;
use App\Support\BiometricTimezoneOptions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBiometricDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active'),
            'connection_type' => $this->input('connection_type', BiometricConnectionType::TcpPull->value),
            'port' => $this->input('port', 4370),
            'model' => $this->input('model', 'iClock990'),
            'protocol' => $this->input('protocol', 'tcp'),
            'timezone' => $this->input('timezone', BiometricTimezoneOptions::Default),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'model' => ['nullable', 'string', 'max:100'],
            'serial_number' => ['required', 'string', 'max:100', Rule::unique(BiometricDevice::class)],
            'connection_type' => ['required', Rule::enum(BiometricConnectionType::class)],
            'host' => [
                Rule::requiredIf(fn (): bool => in_array($this->input('connection_type'), [
                    BiometricConnectionType::TcpPull->value,
                    BiometricConnectionType::DeviceWebReport->value,
                ], true)),
                'nullable',
                'string',
                'max:255',
            ],
            'port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'comm_key' => ['nullable', 'string', 'max:50'],
            'protocol' => ['nullable', 'string', Rule::in(['tcp', 'udp'])],
            'timezone' => ['required', 'string', 'timezone:all'],
            'is_active' => ['nullable', 'boolean'],
            'web_username' => ['nullable', 'string', 'max:64'],
            'web_password' => ['nullable', 'string', 'max:64'],
            'web_session_id' => ['nullable', 'string', 'max:20', 'regex:/^\d*$/'],
        ];
    }
}
