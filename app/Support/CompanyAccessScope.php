<?php

namespace App\Support;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class CompanyAccessScope
{
    public function isGlobalAdmin(?User $user): bool
    {
        return $user instanceof User && $user->isAdministrator();
    }

    public function companyProfileIdFor(?User $user): ?int
    {
        if ($user === null) {
            return null;
        }

        $user->loadMissing('employee');
        $companyProfileId = $user->employee?->company_profile_id;

        if ($companyProfileId === null) {
            return null;
        }

        $id = filter_var($companyProfileId, FILTER_VALIDATE_INT);

        return $id !== false && $id > 0 ? $id : null;
    }

    public function shouldScope(?User $user): bool
    {
        if ($this->isGlobalAdmin($user)) {
            return false;
        }

        return $this->companyProfileIdFor($user) !== null;
    }

    /**
     * @param  Builder<Employee>  $query
     * @return Builder<Employee>
     */
    public function scopeEmployees(Builder $query, ?User $user): Builder
    {
        if ($this->isGlobalAdmin($user)) {
            return $query;
        }

        $companyProfileId = $this->companyProfileIdFor($user);

        if ($companyProfileId === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('company_profile_id', $companyProfileId);
    }

    /**
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    public function scopeRelationViaEmployee(Builder $query, ?User $user, string $relation = 'employee'): Builder
    {
        if ($this->isGlobalAdmin($user)) {
            return $query;
        }

        $companyProfileId = $this->companyProfileIdFor($user);

        if ($companyProfileId === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereHas($relation, fn (Builder $employeeQuery) => $employeeQuery
            ->where('company_profile_id', $companyProfileId));
    }

    /**
     * @param  Builder<\App\Models\Department>  $query
     * @return Builder<\App\Models\Department>
     */
    public function scopeDepartmentsWithCompanyEmployees(Builder $query, ?User $user): Builder
    {
        if ($this->isGlobalAdmin($user)) {
            return $query;
        }

        $companyProfileId = $this->companyProfileIdFor($user);

        if ($companyProfileId === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereHas('employees', fn (Builder $employeeQuery) => $employeeQuery
            ->where('company_profile_id', $companyProfileId));
    }

    public function canAccessEmployee(?User $user, Employee $employee): bool
    {
        if ($this->isGlobalAdmin($user)) {
            return true;
        }

        $companyProfileId = $this->companyProfileIdFor($user);

        if ($companyProfileId === null || $employee->company_profile_id === null) {
            return false;
        }

        return (int) $employee->company_profile_id === $companyProfileId;
    }

    public function assertCanAccessEmployee(?User $user, Employee $employee): void
    {
        if (! $this->canAccessEmployee($user, $employee)) {
            abort(403);
        }
    }

    /**
     * Employee messaging search is relaxed when the viewer has no company profile
     * (common in single-organization installs where company master was not assigned).
     *
     * @param  Builder<Employee>  $query
     * @return Builder<Employee>
     */
    public function scopeEmployeesForMessaging(Builder $query, ?User $user): Builder
    {
        if ($this->isGlobalAdmin($user)) {
            return $query;
        }

        $companyProfileId = $this->companyProfileIdFor($user);

        if ($companyProfileId === null) {
            return $query;
        }

        return $query->where('company_profile_id', $companyProfileId);
    }

    public function canMessageEmployee(?User $user, Employee $employee): bool
    {
        if ($this->isGlobalAdmin($user)) {
            return true;
        }

        $viewerCompanyProfileId = $this->companyProfileIdFor($user);

        if ($viewerCompanyProfileId === null) {
            return true;
        }

        if ($employee->company_profile_id === null) {
            return false;
        }

        return (int) $employee->company_profile_id === $viewerCompanyProfileId;
    }

    public function assertCanAccessCompanyProfile(?User $user, int $companyProfileId): void
    {
        if ($this->isGlobalAdmin($user)) {
            return;
        }

        $viewerCompanyProfileId = $this->companyProfileIdFor($user);

        if ($viewerCompanyProfileId === null || $viewerCompanyProfileId !== $companyProfileId) {
            abort(403);
        }
    }

    /**
     * @return Builder<Employee>
     */
    public function scopedEmployeeQuery(?User $user): Builder
    {
        return $this->scopeEmployees(Employee::query(), $user);
    }
}
