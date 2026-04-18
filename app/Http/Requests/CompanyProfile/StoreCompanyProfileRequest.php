<?php

namespace App\Http\Requests\CompanyProfile;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyProfileRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'logo' => ['nullable', 'image', 'max:2048'],
            'company_name' => ['required', 'string', 'max:255'],
            'company_address_1' => ['nullable', 'string', 'max:255'],
            'company_address_2' => ['nullable', 'string', 'max:255'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'website' => ['nullable', 'string', 'url', 'max:255'],
            'signature_template' => ['nullable', 'string'],
        ];
    }
}
