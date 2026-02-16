<?php

namespace App\Http\Requests\Country;

use App\Models\Country;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCountryRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Country $country */
        $country = $this->route('country');

        return [
            'code' => [
                'required',
                'string',
                'size:2',
                Rule::unique(Country::class)->ignore($country->id),
            ],
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}
