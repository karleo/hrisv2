<?php

namespace App\Http\Requests\Biometric;

use App\Models\BiometricDevice;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadBiometricFileRequest extends FormRequest
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
            'file' => ['required', 'file', 'max:10240', 'mimes:csv,txt,dat,tsv'],
            'format' => ['nullable', 'string', Rule::in(['zk_attlog', 'zk_csv'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.mimes' => 'Upload a CSV or ZKTeco ATTLOG file (.csv, .txt, .dat, .tsv).',
            'file.max' => 'The file may not be larger than 10 MB.',
        ];
    }
}
