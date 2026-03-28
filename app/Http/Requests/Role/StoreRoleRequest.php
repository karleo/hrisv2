<?php

namespace App\Http\Requests\Role;

use App\Enums\PermissionModule;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique(Role::class, 'slug'),
            ],
            'description' => ['nullable', 'string', 'max:2000'],
            'permissions' => ['required', 'array'],
        ];

        foreach (PermissionModule::cases() as $module) {
            $m = $module->value;
            foreach (['can_access', 'can_view', 'can_create', 'can_update', 'can_delete', 'can_check_in', 'can_check_out'] as $field) {
                $rules["permissions.{$m}.{$field}"] = ['sometimes', 'boolean'];
            }
        }

        return $rules;
    }
}
