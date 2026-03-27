<?php

namespace App\Models;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property bool $is_system
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Role extends Model
{
    /** @use HasFactory<\Database\Factories\RoleFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
        ];
    }

    public function modulePermissions(): HasMany
    {
        return $this->hasMany(RoleModulePermission::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id');
    }

    public function grants(PermissionModule $module, ModuleAbility $ability): bool
    {
        $row = $this->modulePermissions->firstWhere('module', $module);

        if (! $row instanceof RoleModulePermission) {
            return false;
        }

        return match ($ability) {
            ModuleAbility::Access => $row->can_access,
            ModuleAbility::View => $row->can_access && $row->can_view,
            ModuleAbility::Create => $row->can_access && $row->can_create,
            ModuleAbility::Update => $row->can_access && $row->can_update,
            ModuleAbility::Delete => $row->can_access && $row->can_delete,
        };
    }

    /**
     * @return array<string, array{can_access: bool, can_view: bool, can_create: bool, can_update: bool, can_delete: bool}>
     */
    public function modulePermissionsPayload(): array
    {
        $payload = [];

        foreach (PermissionModule::cases() as $module) {
            $payload[$module->value] = [
                'can_access' => false,
                'can_view' => false,
                'can_create' => false,
                'can_update' => false,
                'can_delete' => false,
            ];
        }

        foreach ($this->modulePermissions as $row) {
            $payload[$row->module->value] = [
                'can_access' => $row->can_access,
                'can_view' => $row->can_view,
                'can_create' => $row->can_create,
                'can_update' => $row->can_update,
                'can_delete' => $row->can_delete,
            ];
        }

        return $payload;
    }
}
