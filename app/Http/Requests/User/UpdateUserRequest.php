<?php

namespace App\Http\Requests\User;

use App\Models\User;
use App\Rules\DisallowCommonAndPersonalPassword;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (! filled($this->password)) {
            $this->merge([
                'password' => null,
                'password_confirmation' => null,
            ]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user->id),
            ],
            'password' => [
                'nullable',
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
            'face_capture_front' => ['nullable', 'image', 'max:128'],
            'face_capture_left' => ['nullable', 'image', 'max:128'],
            'face_capture_right' => ['nullable', 'image', 'max:128'],
        ];
    }
}
