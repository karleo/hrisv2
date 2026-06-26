<?php

namespace App\Support;

use App\Models\Employee;

final class EmployeePhotoUrl
{
    /**
     * Browser URL for an employee profile photo stored on the public disk.
     */
    public static function forPublicDisk(?Employee $employee): ?string
    {
        if ($employee === null || blank($employee->photo)) {
            return null;
        }

        return PublicStorageUrl::forPath((string) $employee->photo);
    }
}
