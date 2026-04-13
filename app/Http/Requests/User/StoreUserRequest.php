<?php

namespace App\Http\Requests\User;

use App\Enums\FaceProfileAngle;
use App\Models\User;
use App\Rules\DisallowCommonAndPersonalPassword;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $face = [];
        foreach (FaceProfileAngle::ordered() as $angle) {
            $face['face_capture_'.$angle->value] = ['required', 'image', 'max:128'];
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)->mixedCase()->letters()->numbers(),
                new DisallowCommonAndPersonalPassword(
                    (string) $this->input('name', ''),
                    (string) $this->input('email', ''),
                ),
            ],
            'role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'employee_id' => ['nullable', 'integer', 'exists:employees,id'],
            ...$face,
        ];
    }
}
