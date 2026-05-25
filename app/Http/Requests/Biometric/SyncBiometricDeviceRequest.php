<?php

namespace App\Http\Requests\Biometric;

use App\Models\BiometricDevice;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncBiometricDeviceRequest extends FormRequest
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
            'biometric_device_id' => ['required', 'integer', Rule::exists(BiometricDevice::class, 'id')],
            'from' => ['nullable', 'date', 'required_with:to'],
            'to' => ['nullable', 'date', 'after_or_equal:from', 'required_with:from'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'to.after_or_equal' => 'The end date must be on or after the start date.',
        ];
    }
}
