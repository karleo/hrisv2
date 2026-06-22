<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AiAssistantUpdateRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'enabled' => ['required', 'boolean'],
            'provider' => ['required', 'string', Rule::in(['openai'])],
            'model' => ['required', 'string', 'max:100'],
            'api_key' => ['nullable', 'string', 'max:255'],
            'base_url' => ['nullable', 'url', 'max:255'],
            'max_history' => ['required', 'integer', 'between:1,100'],
            'rate_limit' => ['required', 'integer', 'between:1,120'],
        ];
    }
}
