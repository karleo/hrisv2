<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeePrivateInformationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'phone' => ['nullable', 'regex:/^[0-9+\-\s()]+$/', 'max:50'],
            'mobile' => ['nullable', 'regex:/^[0-9+\-\s()]+$/', 'max:50'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'in:Male,Female,Other'],
            'marital_status' => ['nullable', 'in:Single,Married,Other'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'regex:/^[0-9+\-\s()]+$/', 'max:50'],
        ];
    }
}

