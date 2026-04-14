<?php

namespace App\Http\Requests\LeaveType;

use App\Models\LeaveType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveTypeRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique(LeaveType::class),
            ],
            'name' => ['required', 'string', 'max:255'],
            'leave_category' => ['required', 'string', Rule::in(['paid', 'unpaid'])],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
