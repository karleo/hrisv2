import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Employee Master List</CardTitle>
                            <CardDescription>
                                Manage employee codes, names, and details
                            </CardDescription>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <DataTableToolbar
                                searchUrl={index().url}
                                searchPlaceholder="Search code, name, email..."
                                filters={filters}
                            />
                            <Link href={create().url}>
                                <Button>
                                    <Plus />
                                    Add Employee
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium">
                                            Code
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Contact
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Department
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Job Position
                                        </th>
                                        <th className="w-24 px-4 py-3 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employeeList.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                {filters.search
                                                    ? 'No employees match your search.'
                                                    : 'No employees found. Create one to get started.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        employeeList.map((employee) => (
                                            <tr
                                                key={employee.id}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <td className="px-4 py-3 font-mono">
                                                    {employee.employee_code}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {employee.first_name}{' '}
                                                    {employee.last_name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {employee.email_address}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {employee.contact_number ??
                                                        '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {employee.department
                                                        ?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {employee.job_position
                                                        ?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={edit({
                                                                employee:
                                                                    employee.id,
                                                            }).url}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label="Edit"
                                                            >
                                                                <Pencil />
                                                            </Button>
                                                        </Link>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label="Delete"
                                                                >
                                                                    <Trash2 className="text-destructive" />
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
                                                                                    employee.id
                                                                                )
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
        </AppLayout>
    );
}
