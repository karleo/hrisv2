<?php

namespace App\Http\Requests\Role;

use App\Enums\PermissionModule;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Role $role */
        $role = $this->route('role');

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'permissions' => ['required', 'array'],
        ];

        if (! $role->is_system) {
            $rules['slug'] = [
                'required',
                'string',
                'max:255',
                Rule::unique(Role::class, 'slug')->ignore($role->id),
            ];
        }

        foreach (PermissionModule::cases() as $module) {
            $m = $module->value;
            foreach (['can_access', 'can_view', 'can_create', 'can_update', 'can_delete'] as $field) {
                $rules["permissions.{$m}.{$field}"] = ['sometimes', 'boolean'];
            }
        }

        return $rules;
    }
}
