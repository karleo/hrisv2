<?php

namespace App\Http\Requests\HardwareAssetValue;

use App\Models\Hardware;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'asset_model' => ['nullable', 'string', 'max:255'],
            'asset_value' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99', 'required_with:asset_currency'],
            'asset_currency' => ['nullable', 'string', Rule::in(['AED', 'USD', 'SAR']), 'required_with:asset_value'],
            'purchase_date' => ['nullable', 'date', 'before_or_equal:today'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'specs' => ['nullable', 'string', 'max:5000'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', Rule::when($this->filled('effective_from'), ['after_or_equal:effective_from'])],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
