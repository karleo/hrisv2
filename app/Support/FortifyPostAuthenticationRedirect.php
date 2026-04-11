<?php

namespace App\Support;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\User;
use Illuminate\Http\Request;

final class FortifyPostAuthenticationRedirect
{
    /**
     * Path to send the user after password login or two-factor login.
     * Dashboard is gated by {@see \App\Http\Middleware\EnforceModulePermissions}.
     */
    public static function path(Request $request): string
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return config('fortify.home');
        }

        if ($user->hasModuleAbility(PermissionModule::Dashboard, ModuleAbility::View)) {
            return route('dashboard', absolute: false);
        }

        if ($user->employee()->exists()) {
            return route('my-profile.show', absolute: false);
        }

        return route('profile.edit', absolute: false);
    }
}
