<?php

namespace App\Http\Requests\ItAsset;

use App\Enums\ItAssetStatus;
use App\Models\ItAsset;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateItAssetRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('asset_currency')) {
            $this->merge([
                'asset_currency' => strtoupper(trim((string) $this->input('asset_currency'))),
            ]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'asset_tag' => ['nullable', 'string', 'max:100'],
            'license_key' => ['nullable', 'string', 'max:255'],
            'license_seats' => ['nullable', 'integer', 'min:1', 'max:9999'],
            'expiry_date' => ['nullable', 'date'],
            'purchase_date' => ['nullable', 'date'],
            'warranty_expires_at' => ['nullable', 'date'],
            'asset_value' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99', 'required_with:asset_currency'],
            'asset_currency' => ['nullable', 'string', Rule::in(['AED', 'USD', 'SAR']), 'required_with:asset_value'],
            'condition_notes' => ['nullable', 'string', 'max:2000'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ];

        $itAsset = $this->route('it_asset');
        if ($itAsset instanceof ItAsset && $itAsset->status === ItAssetStatus::Assigned) {
            $rules['documents'] = ['nullable', 'array', 'max:5'];
            $rules['documents.*'] = ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'label',
            'asset_value' => 'asset value',
            'asset_currency' => 'currency',
            'documents' => 'assignment documents',
            'documents.*' => 'assignment document',
        ];
    }
}
