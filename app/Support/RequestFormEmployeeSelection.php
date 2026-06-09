<?php

namespace App\Support;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

final class RequestFormEmployeeSelection
{
    public function __construct(
        private readonly CompanyAccessScope $companyScope,
        private readonly RequestApprovalScope $approvalScope,
    ) {}

    public function canChooseEmployee(?User $user): bool
    {
        if ($user === null) {
            return true;
        }

        if ($this->approvalScope->isAdministratorOrHr($user)) {
            return true;
        }

        $user->loadMissing('role');

        return strtolower((string) $user->role?->slug) !== 'employee';
    }

    /**
     * @param  list<string>  $columns
     * @return Collection<int, Employee>
     */
    public function employeesForForm(?User $user, array $columns): Collection
    {
        if (! $this->canChooseEmployee($user)) {
            $user?->loadMissing('employee');
            $employee = $user?->employee;

            if ($employee === null) {
                return new Collection;
            }

            $record = Employee::query()->whereKey($employee->id)->first($columns);

            return $record instanceof Employee ? new Collection([$record]) : new Collection;
        }

        return $this->companyScope->employeesForRequestForms($user, $columns);
    }
}
