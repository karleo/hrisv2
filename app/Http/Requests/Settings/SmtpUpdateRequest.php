<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SmtpUpdateRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'mail_enabled' => ['required', 'boolean'],
            'workflow_email_enabled' => ['required', 'boolean'],
            'provider_preset' => ['nullable', 'string', Rule::in(['custom', 'gmail', 'microsoft365', 'zoho', 'yahoo', 'aws_ses'])],
            'host' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer', 'between:1,65535'],
            'encryption' => ['nullable', Rule::in(['tls', 'ssl'])],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
            'timeout' => ['nullable', 'integer', 'between:1,300'],
            'from_address' => ['required', 'email:rfc,dns', 'max:255'],
            'from_name' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'host.required' => 'SMTP host is required.',
            'port.required' => 'SMTP port is required.',
            'from_address.required' => 'From email address is required.',
            'from_name.required' => 'From display name is required.',
        ];
    }
}
