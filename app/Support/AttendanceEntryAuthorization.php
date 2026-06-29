<?php

namespace App\Support;

use App\Enums\ModuleAbility;
use App\Enums\PermissionModule;
use App\Models\User;

final class AttendanceEntryAuthorization
{
    public function canManageForOthers(User $user): bool
    {
        if ($user->isAdministrator()) {
            return true;
        }

        return $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::CheckIn)
            && $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::Update);
    }

    public function canDelete(User $user): bool
    {
        if (! $user->hasModuleAbility(PermissionModule::TimeAttendance, ModuleAbility::Delete)) {
            return false;
        }

        return $this->canManageForOthers($user);
    }

    public function canModifyOvertime(User $user): bool
    {
        if ($user->isAdministrator()) {
            return true;
        }

        return $user->hasModuleAbility(PermissionModule::Payroll, ModuleAbility::Verify);
    }
}
