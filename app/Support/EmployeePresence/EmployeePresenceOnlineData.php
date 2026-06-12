<?php

namespace App\Support\EmployeePresence;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Cache;

final class EmployeePresenceOnlineData
{
    public const CACHE_TTL_SECONDS = 90;

    /**
     * Cache key for "this employee has an active app session (heartbeat)".
     * (Not named `employee_presence_{id}` — use {@see self::cacheKey()} when inspecting Redis/files.)
     */
    public static function cacheKey(int $employeeId): string
    {
        return 'employee_app_active_v1_'.$employeeId;
    }

    public static function recordHeartbeat(Employee $employee): void
    {
        Cache::put(
            self::cacheKey($employee->id),
            time(),
            now()->addSeconds(self::CACHE_TTL_SECONDS),
        );
    }

    public static function hasActiveHeartbeat(int $employeeId): bool
    {
        $cached = Cache::get(self::cacheKey($employeeId));

        if ($cached === true) {
            return true;
        }

        return is_int($cached) && $cached > 0;
    }

    /**
     * Remove cached "active app" state (e.g. on logout so peers see offline immediately).
     */
    public static function forgetAppPresenceForUser(?Authenticatable $user): void
    {
        if (! $user instanceof User) {
            return;
        }

        $employeeId = filter_var($user->employee?->id, FILTER_VALIDATE_INT);

        if ($employeeId === false || $employeeId < 1) {
            return;
        }

        Cache::forget(self::cacheKey($employeeId));
    }

    /**
     * @return array{employee_ids: list<int>, employees: list<array<string, mixed>>}
     */
    public function onlinePeersForViewer(Employee $viewer): array
    {
        $candidateIds = Employee::query()
            ->whereHas('user', fn ($query) => $query->where('is_active', true))
            ->whereKeyNot($viewer->id)
            ->pluck('id');

        $onlineIds = [];
        foreach ($candidateIds as $id) {
            $intId = (int) $id;
            if (self::hasActiveHeartbeat($intId)) {
                $onlineIds[] = $intId;
            }
        }

        $employees = Employee::query()
            ->whereIn('id', $onlineIds)
            ->with(['department', 'jobPosition'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(fn (Employee $employee) => $this->presenceEmployeePayload($employee))
            ->values()
            ->all();

        return [
            'employee_ids' => $onlineIds,
            'employees' => $employees,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presenceEmployeePayload(Employee $employee): array
    {
        $employee->loadMissing(['department', 'jobPosition']);

        return [
            'id' => (int) $employee->id,
            'employee_code' => $employee->employee_code,
            'first_name' => $employee->first_name,
            'last_name' => $employee->last_name,
            'full_name' => trim("{$employee->first_name} {$employee->last_name}"),
            'department' => $employee->department?->name,
            'job_position' => $employee->jobPosition?->name,
            'photo_url' => is_string($employee->photo) && $employee->photo !== ''
                ? '/storage/'.ltrim($employee->photo, '/')
                : null,
        ];
    }
}
