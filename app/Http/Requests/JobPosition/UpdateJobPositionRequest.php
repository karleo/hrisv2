<?php

namespace App\Http\Requests\JobPosition;

use App\Models\JobPosition;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobPositionRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var JobPosition $jobPosition */
        $jobPosition = $this->route('job_position');

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique(JobPosition::class)->ignore($jobPosition->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
