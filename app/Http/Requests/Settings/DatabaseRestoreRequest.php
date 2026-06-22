<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class DatabaseRestoreRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'backup_file' => ['required', 'file', 'max:512000'],
            'confirm_restore' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'backup_file.required' => 'Choose a backup file to restore.',
            'confirm_restore.accepted' => 'You must confirm that restoring will overwrite the current database.',
        ];
    }
}
