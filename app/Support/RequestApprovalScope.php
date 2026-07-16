<?php

namespace App\Support;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class RequestApprovalScope
{
    public function __construct(private readonly CompanyAccessScope $companyScope) {}

    /**
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    public function scopeVisible(Builder $query, ?User $user): Builder
    {
        if ($user === null) {
            return $query->whereRaw('1 = 0');
        }

        if ($this->companyScope->isGlobalAdmin($user)) {
            return $query;
        }

        $employeeId = $this->employeeId($user);
        $departmentIds = $this->managedDepartmentIds($user);
        $companyProfileId = $this->companyScope->companyProfileIdFor($user);
        $isHr = $this->isHr($user);

        return $query->where(function (Builder $inner) use ($employeeId, $departmentIds, $companyProfileId, $isHr): void {
            $hasClause = false;

            if ($employeeId !== null) {
                $inner->where('employee_id', $employeeId);
                $hasClause = true;
            }

            if ($departmentIds !== []) {
                $method = $hasClause ? 'orWhere' : 'where';
                $inner->{$method}(function (Builder $departmentScope) use ($departmentIds, $companyProfileId): void {
                    $departmentScope->whereIn('department_id', $departmentIds);

                    if ($companyProfileId !== null) {
                        $departmentScope->whereHas('employee', fn (Builder $employeeQuery) => $employeeQuery
                            ->where('company_profile_id', $companyProfileId));
                    }
                });
                $hasClause = true;
            }

            if ($isHr && $companyProfileId !== null) {
                $method = $hasClause ? 'orWhereHas' : 'whereHas';
                $inner->{$method}('employee', fn (Builder $employeeQuery) => $employeeQuery
                    ->where('company_profile_id', $companyProfileId));
                $hasClause = true;
            }

            if (! $hasClause) {
                $inner->whereRaw('1 = 0');
            }
        });
    }

    public function canView(?User $user, int $employeeId, int $departmentId): bool
    {
        if ($user === null) {
            return false;
        }

        if ($this->companyScope->isGlobalAdmin($user)) {
            return true;
        }

        if ($this->employeeId($user) === $employeeId) {
            return true;
        }

        $employee = Employee::query()->find($employeeId);
        if ($employee === null || ! $this->companyScope->canAccessEmployee($user, $employee)) {
            return false;
        }

        if ($this->isHr($user)) {
            return true;
        }

        if (in_array($departmentId, $this->managedDepartmentIds($user), true)) {
            return true;
        }

        return $this->isManagerForDepartment($user, $departmentId);
    }

    public function canModify(?User $user, int $employeeId, int $departmentId, string $status): bool
    {
        if ($user === null) {
            return false;
        }

        if ($this->companyScope->isGlobalAdmin($user)) {
            return true;
        }

        if ($this->employeeId($user) === $employeeId && strtolower($status) === 'draft') {
            return true;
        }

        $employee = Employee::query()->find($employeeId);
        if ($employee === null || ! $this->companyScope->canAccessEmployee($user, $employee)) {
            return false;
        }

        if ($this->isHr($user)) {
            return true;
        }

        if (in_array($departmentId, $this->managedDepartmentIds($user), true)) {
            return true;
        }

        if ($this->isManagerForDepartment($user, $departmentId)) {
            return true;
        }

        return false;
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

        if ($this->companyScope->isGlobalAdmin($user)) {
            return true;
        }

        $employee = Employee::query()->find($employeeId);
        if ($employee === null || ! $this->companyScope->canAccessEmployee($user, $employee)) {
            return false;
        }

        if ($this->isHr($user)) {
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
        return $this->companyScope->isGlobalAdmin($user) || $this->isHr($user);
    }

    public function isHr(User $user): bool
    {
        $user->loadMissing('role');
        if ($user->role === null) {
            return false;
        }

        $slug = strtolower((string) $user->role->slug);
        $name = strtolower((string) $user->role->name);

        return in_array($slug, ['hr', 'hr_executive', 'human_resources', 'human-resources'], true)
            || str_contains($slug, 'human-resource')
            || str_contains($slug, 'ceo')
            || str_contains($slug, 'chief-executive')
            || str_contains($name, 'hr')
            || str_contains($name, 'human resource')
            || str_contains($name, 'chief executive officer')
            || $name === 'ceo';
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
