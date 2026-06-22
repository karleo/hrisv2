<?php

namespace App\Http\Requests\Settings;

use App\Models\StorageSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorageSettingUpdateRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'driver' => ['required', Rule::in([StorageSetting::DRIVER_LOCAL, StorageSetting::DRIVER_S3])],
            'aws_access_key_id' => ['nullable', 'string', 'max:255', 'required_if:driver,s3'],
            'aws_secret_access_key' => ['nullable', 'string', 'max:255'],
            'aws_default_region' => ['nullable', 'string', 'max:255', 'required_if:driver,s3'],
            'aws_bucket' => ['nullable', 'string', 'max:255', 'required_if:driver,s3'],
            'aws_url' => ['nullable', 'string', 'max:255'],
            'aws_use_path_style_endpoint' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'aws_access_key_id.required_if' => 'AWS access key ID is required when using S3 storage.',
            'aws_default_region.required_if' => 'AWS region is required when using S3 storage.',
            'aws_bucket.required_if' => 'AWS bucket name is required when using S3 storage.',
        ];
    }
}
