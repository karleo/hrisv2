<?php

namespace App\Http\Requests\ItAsset;

use App\Enums\ItAssetStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChangeItAssetStatusRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::enum(ItAssetStatus::class),
                Rule::notIn([ItAssetStatus::Assigned->value]),
            ],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
