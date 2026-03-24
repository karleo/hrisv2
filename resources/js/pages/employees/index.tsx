import { Head, Link, router } from '@inertiajs/react';
import {
    CreditCard,
    Key,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { create, edit, index } from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: index().url,
    },
];

type Department = {
    id: number;
    code: string;
    name: string;
};

type JobPosition = {
    id: number;
    code: string;
    name: string;
};

type Employee = {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    email_address: string;
    contact_number: string | null;
    address_1: string | null;
    address_2: string | null;
    department_id: number;
    job_position_id: number;
    user_id?: number | null;
    role?: 'Employee' | 'Manager' | 'CEO';
    department?: Department;
    job_position?: JobPosition;
};

function AvatarInitial({ name }: { name: string }) {
    const initial = name.trim().slice(0, 1).toUpperCase() || '?';
    return (
        <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
            aria-hidden
        >
            {initial}
        </span>
    );
}

function RoleBadge({ role }: { role?: 'Employee' | 'Manager' | 'CEO' | null }) {
    if (!role) return <span className="text-muted-foreground">—</span>;
    const isManager = role === 'Manager';
    const isCEO = role === 'CEO';
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                isCEO
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    : isManager
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
            }`}
        >
            {role}
        </span>
    );
}

type PaginatedEmployees = {
    data: Employee[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

export default function Index({
    employees,
    filters = {},
}: {
    employees: PaginatedEmployees;
    filters?: { search?: string };
}) {
    const { data: employeeList } = employees;
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />

            <div className="flex min-h-screen flex-1 flex-col bg-muted/30">
                {/* Page header */}
                <div className="border-b bg-card px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Users className="size-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                        Employee Master List
                                    </h1>
                                    <p className="text-muted-foreground text-sm">
                                        Manage employee codes, roles, and system access
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <DataTableToolbar
                                    searchUrl={index().url}
                                    searchPlaceholder="Search code, name, email..."
                                    filters={filters}
                                    autoSearch
                                    showSearchButton={false}
                                />
                                <Link href={create().url}>
                                    <Button size="sm" className="gap-2">
                                        <Plus className="size-4" />
                                        Add Employee
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <Card className="overflow-hidden border shadow-sm">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/40">
                                                <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                    Code
                                                </th>
                                                <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                    Name
                                                </th>
                                                <th className="hidden px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground lg:table-cell">
                                                    Email
                                                </th>
                                                <th className="hidden px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground xl:table-cell">
                                                    Contact
                                                </th>
                                                <th className="hidden px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                                                    Department
                                                </th>
                                                <th className="hidden px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                                                    Job
                                                </th>
                                                <th className="hidden px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                                                    Role
                                                </th>
                                                <th className="w-32 px-4 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employeeList.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={8}
                                                        className="px-4 py-16 text-center"
                                                    >
                                                        <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
                                                            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                                                                {filters.search ? (
                                                                    <Search className="size-8 text-muted-foreground" />
                                                                ) : (
                                                                    <Users className="size-8 text-muted-foreground" />
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="font-medium text-foreground">
                                                                    {filters.search
                                                                        ? 'No employees match your search'
                                                                        : 'No employees yet'}
                                                                </p>
                                                                <p className="text-muted-foreground text-sm">
                                                                    {filters.search
                                                                        ? 'Try a different search term or clear the filter.'
                                                                        : 'Add your first employee to get started.'}
                                                                </p>
                                                            </div>
                                                            {!filters.search && (
                                                                <Link href={create().url}>
                                                                    <Button
                                                                        size="sm"
                                                                        className="gap-2"
                                                                    >
                                                                        <Plus className="size-4" />
                                                                        Add Employee
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                employeeList.map((employee) => (
                                                    <tr
                                                        key={employee.id}
                                                        className="border-b border-border/50 transition-colors hover:bg-muted/40 last:border-0"
                                                    >
                                                        <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                                                            {employee.employee_code}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <AvatarInitial
                                                                    name={
                                                                        employee.first_name
                                                                    }
                                                                />
                                                                <span className="font-medium">
                                                                    {employee.first_name}{' '}
                                                                    {employee.last_name}
                                                                </span>
                                                                {employee.user_id && (
                                                                    <span
                                                                        className="inline-flex size-5 items-center justify-center rounded text-muted-foreground"
                                                                        title="Has system login"
                                                                    >
                                                                        <Key className="size-3.5" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                                                            {employee.email_address}
                                                        </td>
                                                        <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                                                            {employee.contact_number ??
                                                                '—'}
                                                        </td>
                                                        <td className="hidden px-4 py-3 md:table-cell">
                                                            {employee.department
                                                                ?.name ?? '—'}
                                                        </td>
                                                        <td className="hidden px-4 py-3 md:table-cell">
                                                            {employee.job_position
                                                                ?.name ?? '—'}
                                                        </td>
                                                        <td className="hidden px-4 py-3 md:table-cell">
                                                            <RoleBadge
                                                                role={
                                                                    employee.role
                                                                }
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-end gap-0.5">
                                                                <Link
                                                                    href={`/employees/${employee.id}/business-card`}
                                                                    aria-label="Business card"
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-8"
                                                                    >
                                                                        <CreditCard className="size-4" />
                                                                    </Button>
                                                                </Link>
                                                                <Link
                                                                    href={edit({
                                                                        employee:
                                                                            employee.id,
                                                                    }).url}
                                                                    aria-label="Edit"
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-8"
                                                                    >
                                                                        <Pencil className="size-4" />
                                                                    </Button>
                                                                </Link>
                                                                <div className="ml-0.5 border-l border-border pl-0.5">
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                                aria-label="Delete"
                                                                            >
                                                                                <Trash2 className="size-4" />
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                        <DialogContent>
                                                                            <DialogTitle>
                                                                                Delete employee?
                                                                            </DialogTitle>
                                                                            <DialogDescription>
                                                                                Are you sure you want to delete{' '}
                                                                                <strong>
                                                                                    {employee.first_name}{' '}
                                                                                    {employee.last_name}
                                                                                </strong>{' '}
                                                                                ({employee.employee_code})? This action cannot be undone.
                                                                            </DialogDescription>
                                                                            <DialogFooter>
                                                                                <DialogClose asChild>
                                                                                    <Button variant="secondary">
                                                                                        Cancel
                                                                                    </Button>
                                                                                </DialogClose>
                                                                                <Button
                                                                                    variant="destructive"
                                                                                    onClick={() =>
                                                                                        router.delete(
                                                                                            EmployeeController.destroy.url(
                                                                                                employee.id,
                                                                                            ),
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    Delete
                                                                                </Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <DataTablePagination
                                    links={employees.links}
                                    from={employees.from}
                                    to={employees.to}
                                    total={employees.total}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
