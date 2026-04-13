<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
        'role_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
        'face_reference_path',
        'face_profile',
        'face_provider',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
            'face_enrolled_at' => 'datetime',
            /** @var array<string, string>|null */
            'face_profile' => 'array',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    public function isAdministrator(): bool
    {
        $this->loadMissing('role');

        return $this->role instanceof Role && $this->role->slug === 'administrator';
    }

    public function hasModuleAbility(PermissionModule $module, ModuleAbility $ability): bool
    {
        if ($this->isAdministrator()) {
            return true;
        }

        $this->loadMissing('role.modulePermissions');

        if (! $this->role instanceof Role) {
            return false;
        }

        return $this->role->grants($module, $ability);
    }

    /**
     * @return array<string, array{can_access: bool, can_view: bool, can_create: bool, can_update: bool, can_delete: bool, can_check_in: bool, can_check_out: bool}>
     */
    public function modulePermissionsPayload(): array
    {
        if ($this->isAdministrator()) {
            $payload = [];

            foreach (PermissionModule::cases() as $module) {
                $payload[$module->value] = [
                    'can_access' => true,
                    'can_view' => true,
                    'can_create' => true,
                    'can_update' => true,
                    'can_delete' => true,
                    'can_check_in' => true,
                    'can_check_out' => true,
                ];
            }

            return $payload;
        }

        $this->loadMissing('role.modulePermissions');

        if (! $this->role instanceof Role) {
            return [];
        }

        return $this->role->modulePermissionsPayload();
    }
}
