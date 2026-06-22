<?php

namespace App\Http\Requests\CompanyProfile;

use App\Models\DocumentType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanyProfileRequest extends FormRequest
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
            'business_card_logo' => ['nullable', 'image', 'max:2048'],
            'business_card_back_logo_1' => ['nullable', 'image', 'max:2048'],
            'business_card_back_logo_2' => ['nullable', 'image', 'max:2048'],
            'business_card_back_logo_3' => ['nullable', 'image', 'max:2048'],
            'business_card_back_logo_4' => ['nullable', 'image', 'max:2048'],
            'company_name' => ['required', 'string', 'max:255'],
            'company_address_1' => ['nullable', 'string', 'max:255'],
            'company_address_2' => ['nullable', 'string', 'max:255'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'website' => ['nullable', 'string', 'url', 'max:255'],
            'signature_template' => ['nullable', 'string'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'max:10240'],
            'document_type_ids' => ['nullable', 'array'],
            'document_type_ids.*' => ['nullable', 'integer', 'exists:document_types,id'],
            'document_expiry_dates' => ['nullable', 'array'],
            'document_expiry_dates.*' => ['nullable', 'date'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $documentTypeIds = $this->input('document_type_ids', []);
            $documentExpiryDates = $this->input('document_expiry_dates', []);

            foreach ($documentTypeIds as $index => $documentTypeId) {
                if (! filled($documentTypeId)) {
                    continue;
                }

                $documentType = DocumentType::query()->find($documentTypeId);
                if ($documentType === null || ! $documentType->is_active) {
                    $validator->errors()->add("document_type_ids.$index", 'Please select an active document type.');

                    continue;
                }

                if ($documentType->requires_expiry_date && ! filled($documentExpiryDates[$index] ?? null)) {
                    $validator->errors()->add("document_expiry_dates.$index", 'Expiry date is required for the selected document type.');
                }
            }
        });
    }
}
