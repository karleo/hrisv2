<?php

namespace App\Support;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class RequestApprovalScope
{
    /**
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    public function scopeVisible(Builder $query, ?User $user): Builder
    {
        if ($user === null) {
            return $query->whereRaw('1 = 0');
        }

        if ($this->isAdministratorOrHr($user)) {
            return $query;
        }

        $departmentIds = $this->managedDepartmentIds($user);
        if ($departmentIds !== []) {
            return $query->whereIn('department_id', $departmentIds);
        }

        $employeeId = $this->employeeId($user);
        if ($employeeId !== null) {
            return $query->where('employee_id', $employeeId);
        }

        return $query->whereRaw('1 = 0');
    }

    public function canView(?User $user, int $employeeId, int $departmentId): bool
    {
        if ($user === null) {
            return false;
        }

        if ($this->isAdministratorOrHr($user)) {
            return true;
        }

        if (in_array($departmentId, $this->managedDepartmentIds($user), true)) {
            return true;
        }

        if ($this->isManagerForDepartment($user, $departmentId)) {
            return true;
        }

        return $this->employeeId($user) === $employeeId;
    }

    public function canModify(?User $user, int $employeeId, int $departmentId, string $status): bool
    {
        if ($user === null) {
            return false;
        }

        if ($this->isAdministratorOrHr($user)) {
            return true;
        }

        if (in_array($departmentId, $this->managedDepartmentIds($user), true)) {
            return true;
        }

        if ($this->isManagerForDepartment($user, $departmentId)) {
            return true;
        }

        return $this->employeeId($user) === $employeeId && strtolower($status) === 'draft';
    }

    public function canDecide(?User $user, int $employeeId, int $departmentId, string $status): bool
    {
        if ($user === null) {
            return false;
        }

        if (strtolower($status) !== 'submitted') {
            return false;
        }

        $currentEmployeeId = $this->employeeId($user);
        if ($currentEmployeeId !== null && $currentEmployeeId === $employeeId) {
            return false;
        }

        if ($this->isAdministratorOrHr($user)) {
            return true;
        }

        return in_array($departmentId, $this->managedDepartmentIds($user), true)
            || $this->isManagerForDepartment($user, $departmentId);
    }

    /**
     * @return list<int>
     */
    public function managedDepartmentIds(User $user): array
    {
        $employeeId = $this->employeeId($user);
        if ($employeeId === null) {
            return [];
        }

        return Department::query()
            ->where('manager_employee_id', $employeeId)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @return list<User>
     */
    public function hrUsers(): array
    {
        return User::query()
            ->with('role')
            ->whereHas('role', function ($query): void {
                $query->whereIn('slug', ['hr', 'human_resources', 'human-resources'])
                    ->orWhere('name', 'like', '%HR%');
            })
            ->get()
            ->all();
    }

    public function managerUserByDepartmentId(int $departmentId): ?User
    {
        $department = Department::query()
            ->with('managerEmployee.user')
            ->find($departmentId);

        return $department?->managerEmployee?->user;
    }

    public function isAdministratorOrHr(User $user): bool
    {
        if ($user->isAdministrator()) {
            return true;
        }

        $user->loadMissing('role');
        if ($user->role === null) {
            return false;
        }

        $slug = strtolower((string) $user->role->slug);
        $name = strtolower((string) $user->role->name);

        return in_array($slug, ['hr', 'human_resources', 'human-resources'], true)
            || str_contains($slug, 'human-resource')
            || str_contains($name, 'hr')
            || str_contains($name, 'human resource');
    }

    private function isManagerForDepartment(User $user, int $departmentId): bool
    {
        $user->loadMissing('role', 'employee.jobPosition');
        $employee = $user->employee;
        if ($employee === null) {
            return false;
        }

        $roleSlug = strtolower((string) ($user->role?->slug ?? ''));
        $roleName = strtolower((string) ($user->role?->name ?? ''));
        $jobName = strtolower((string) ($employee->jobPosition?->name ?? ''));

        $isManagerRole = str_contains($roleSlug, 'manager')
            || str_contains($roleName, 'manager')
            || str_contains($jobName, 'manager');

        return $isManagerRole && (int) $employee->department_id === $departmentId;
    }

    private function employeeId(User $user): ?int
    {
        $user->loadMissing('employee');

        return $user->employee?->id;
    }
}

