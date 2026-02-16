<?php

namespace App\Http\Requests\Software;

use App\Models\Software;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSoftwareRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Software $software */
        $software = $this->route('software');

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique(Software::class)->ignore($software->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
