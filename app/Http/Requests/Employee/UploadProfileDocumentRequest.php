<?php

namespace App\Http\Requests\Employee;

use App\Models\DocumentType;
use Illuminate\Foundation\Http\FormRequest;

class UploadProfileDocumentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'document_type_id' => ['required', 'integer', 'exists:document_types,id'],
            'expiry_date' => ['nullable', 'date'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $documentType = DocumentType::query()->find($this->input('document_type_id'));
            if ($documentType === null || ! $documentType->is_active) {
                $validator->errors()->add('document_type_id', 'Please select an active document type.');

                return;
            }

            if ($documentType->requires_expiry_date && ! filled($this->input('expiry_date'))) {
                $validator->errors()->add('expiry_date', 'Expiry date is required for the selected document type.');
            }
        });
    }
}
