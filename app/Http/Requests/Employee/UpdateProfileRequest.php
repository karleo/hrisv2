<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'profile_address_1' => ['required', 'string', 'max:255'],
            'profile_address_2' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'regex:/^[0-9+\-\s()]+$/', 'max:50'],
            'mobile' => ['required', 'regex:/^[0-9+\-\s()]+$/', 'max:50'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:Male,Female'],
            'marital_status' => ['required', 'in:Single,Married,Other'],
            'emergency_contact_name' => ['required', 'string', 'max:255'],
            'emergency_contact_phone' => ['required', 'regex:/^[0-9+\-\s()]+$/', 'max:50'],
        ];
    }
}
