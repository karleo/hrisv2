<?php

namespace App\Http\Requests\ItAsset;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ReturnItAssetRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'condition_on_return' => ['nullable', 'string', 'max:255'],
            'return_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
