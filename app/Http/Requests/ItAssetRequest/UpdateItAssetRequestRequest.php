<?php

namespace App\Http\Requests\ItAssetRequest;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Hardware;
use Illuminate\Foundation\Http\FormRequest;

class UpdateItAssetRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:'.Employee::class.',id'],
            'department_id' => ['required', 'integer', 'exists:'.Department::class.',id'],
            'date' => ['required', 'date'],
            'date_issued' => ['nullable', 'date'],
            'hardware_ids' => ['nullable', 'array'],
            'hardware_ids.*' => ['integer', 'exists:'.Hardware::class.',id'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'string', 'in:draft,submitted'],
        ];
    }
}
