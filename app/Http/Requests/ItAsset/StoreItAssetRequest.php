<?php

namespace App\Http\Requests\ItAsset;

use App\Http\Requests\ItAsset\Concerns\ValidatesItAssetAttributes;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreItAssetRequest extends FormRequest
{
    use ValidatesItAssetAttributes;

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
        return $this->baseItAssetRules();
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->itAssetAttributeNames();
    }
}
