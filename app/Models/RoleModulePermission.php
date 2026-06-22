<?php

namespace App\Models;

use App\Enums\PermissionModule;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $role_id
 * @property PermissionModule $module
 * @property bool $can_access
 * @property bool $can_view
 * @property bool $can_create
 * @property bool $can_update
 * @property bool $can_delete
 * @property bool $can_check_in
 * @property bool $can_check_out
 * @property bool $can_verify
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class RoleModulePermission extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'role_id',
        'module',
        'can_access',
        'can_view',
        'can_create',
        'can_update',
        'can_delete',
        'can_check_in',
        'can_check_out',
        'can_verify',
    ];

    protected function casts(): array
    {
        return [
            'module' => PermissionModule::class,
            'can_access' => 'boolean',
            'can_view' => 'boolean',
            'can_create' => 'boolean',
            'can_update' => 'boolean',
            'can_delete' => 'boolean',
            'can_check_in' => 'boolean',
            'can_check_out' => 'boolean',
            'can_verify' => 'boolean',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }
}
