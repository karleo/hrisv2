<?php

namespace App\Http\Requests\HardwareAssetValue;

use App\Models\Hardware;
use Illuminate\Foundation\Http\FormRequest;

class StoreHardwareAssetValueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('asset_currency')) {
            $this->merge([
                'asset_currency' => strtoupper(trim((string) $this->input('asset_currency'))),
            ]);
        }
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'hardware_id' => ['required', 'integer', 'exists:'.Hardware::class.',id'],
            'asset_value' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99', 'required_with:asset_currency'],
            'asset_currency' => ['nullable', 'string', 'size:3', 'regex:/^[A-Z]{3}$/', 'required_with:asset_value'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
