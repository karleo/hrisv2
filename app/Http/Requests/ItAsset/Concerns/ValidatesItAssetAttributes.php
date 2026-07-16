<?php

namespace App\Http\Requests\ItAsset\Concerns;

use App\Enums\ItAssetCategory;
use App\Enums\ItAssetStatus;
use App\Models\Accessory;
use App\Models\Hardware;
use App\Models\HardwareAssetValue;
use App\Models\Software;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

trait ValidatesItAssetAttributes
{
    /**
     * @return array<string, mixed>
     */
    protected function baseItAssetRules(bool $requireStatus = false): array
    {
        $category = $this->input('category');

        $rules = [
            'category' => ['required', new Enum(ItAssetCategory::class)],
            'name' => ['required', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'condition_notes' => ['nullable', 'string', 'max:2000'],
        ];

        if ($requireStatus) {
            $rules['status'] = ['required', new Enum(ItAssetStatus::class)];
        }

        if ($category === ItAssetCategory::Hardware->value) {
            $rules['hardware_id'] = ['required', Rule::exists(Hardware::class, 'id')];
            $rules['hardware_asset_value_id'] = [
                'nullable',
                Rule::exists(HardwareAssetValue::class, 'id')->where(
                    fn ($query) => $query->where('hardware_id', $this->input('hardware_id'))
                ),
            ];
            $rules['serial_number'] = ['nullable', 'string', 'max:100'];
            $rules['asset_tag'] = ['nullable', 'string', 'max:100'];
            $rules['purchase_date'] = ['nullable', 'date'];
            $rules['warranty_expires_at'] = ['nullable', 'date'];
            $rules['asset_value'] = ['nullable', 'numeric', 'min:0', 'max:999999999999.99', 'required_with:asset_currency'];
            $rules['asset_currency'] = ['nullable', 'string', Rule::in(['AED', 'USD', 'SAR']), 'required_with:asset_value'];
        }

        if ($category === ItAssetCategory::Software->value) {
            $rules['software_id'] = ['required', Rule::exists(Software::class, 'id')];
            $rules['license_key'] = ['nullable', 'string', 'max:255'];
            $rules['license_seats'] = ['nullable', 'integer', 'min:1', 'max:10000'];
            $rules['expiry_date'] = ['nullable', 'date'];
        }

        if ($category === ItAssetCategory::Accessory->value) {
            $rules['accessory_id'] = ['required', Rule::exists(Accessory::class, 'id')];
            $rules['serial_number'] = ['nullable', 'string', 'max:100'];
            $rules['asset_tag'] = ['nullable', 'string', 'max:100'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    protected function itAssetAttributeNames(): array
    {
        return [
            'name' => 'label',
            'hardware_id' => 'device type',
            'hardware_asset_value_id' => 'model',
            'software_id' => 'software',
            'accessory_id' => 'accessory',
            'asset_value' => 'asset value',
            'asset_currency' => 'currency',
        ];
    }
}
