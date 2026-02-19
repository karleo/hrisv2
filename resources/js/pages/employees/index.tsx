import { Head, Link, router } from '@inertiajs/react';
import { CreditCard, FileText, Pencil, Plus, Trash2, Users } from 'lucide-react';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
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
    department?: Department;
    job_position?: JobPosition;
};

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

            <div className="flex h-full flex-1 flex-col">
                <div className="border-b bg-gradient-to-b from-muted/30 to-background px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                <Users className="size-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                                    Employee Master List
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    Manage employee codes, names, and details
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

                <div className="flex-1 overflow-x-auto p-4 sm:p-6 lg:p-8">
                    <Card className="border shadow-sm">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="px-4 py-3.5 text-left font-medium">
                                                Code
                                            </th>
                                            <th className="px-4 py-3.5 text-left font-medium">
                                                Name
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-left font-medium lg:table-cell">
                                                Email
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-left font-medium xl:table-cell">
                                                Contact
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-left font-medium md:table-cell">
                                                Department
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-left font-medium md:table-cell">
                                                Job Position
                                            </th>
                                            <th className="w-28 px-4 py-3.5 text-right font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employeeList.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-4 py-16 text-center"
                                                >
                                                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                                                        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                                                            <FileText className="size-7 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-muted-foreground text-sm">
                                                            {filters.search
                                                                ? 'No employees match your search.'
                                                                : 'No employees yet. Add your first employee to get started.'}
                                                        </p>
                                                        {!filters.search && (
                                                            <Link href={create().url}>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
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
                                                    className="border-b transition-colors hover:bg-muted/30 last:border-0"
                                                >
                                                    <td className="px-4 py-3 font-mono font-medium">
                                                        {employee.employee_code}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {employee.first_name}{' '}
                                                        {employee.last_name}
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
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-end gap-1">
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
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-8"
                                                                        aria-label="Delete"
                                                                    >
                                                                        <Trash2 className="size-4 text-destructive" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogTitle>
                                                                        Delete
                                                                        employee?
                                                                    </DialogTitle>
                                                                    <DialogDescription>
                                                                        Are you sure
                                                                        you want to
                                                                        delete{' '}
                                                                        <strong>
                                                                            {employee.first_name}{' '}
                                                                            {employee.last_name}
                                                                        </strong>{' '}
                                                                        (
                                                                        {
                                                                            employee.employee_code
                                                                        }
                                                                        )? This
                                                                        action
                                                                        cannot be
                                                                        undone.
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
        </AppLayout>
    );
}
