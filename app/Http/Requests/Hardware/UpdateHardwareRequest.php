<?php

namespace App\Http\Requests\Hardware;

use App\Models\Hardware;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHardwareRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Hardware $hardware */
        $hardware = $this->route('hardware');

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique(Hardware::class)->ignore($hardware->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
