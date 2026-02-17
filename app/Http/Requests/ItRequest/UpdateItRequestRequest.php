<?php

namespace App\Http\Requests\ItRequest;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Hardware;
use App\Models\Software;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateItRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:'.Employee::class.',id'],
            'department_id' => ['required', 'integer', 'exists:'.Department::class.',id'],
            'software_id' => ['nullable', 'integer', 'exists:'.Software::class.',id'],
            'hardware_id' => ['nullable', 'integer', 'exists:'.Hardware::class.',id'],
            'date' => ['required', 'date'],
            'status' => ['sometimes', 'string', 'in:draft,submitted'],
        ];
    }
}
