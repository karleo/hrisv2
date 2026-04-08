import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import {
    CreditCard,
    Download,
    Eye,
    Key,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
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
    DialogHeader,
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
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const [businessCardEmployee, setBusinessCardEmployee] = useState<Employee | null>(null);
    const { data, setData, post, processing, errors, reset } = useForm<{ file: File | null }>({
        file: null,
    });

    function submitImport(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post('/employees/import', {
            forceFormData: true,
            onSuccess: () => reset('file'),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />

            <div className="flex min-h-screen flex-1 flex-col bg-muted/30">
                {/* Page header */}
                <div className="border-b bg-card px-4 py-6 sm:px-6 lg:px-8">
                    <div className="w-full">
                        {(flash?.success || flash?.error) && (
                            <div className="mb-4 space-y-2">
                                {flash?.success && (
                                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                                        {flash.success}
                                    </div>
                                )}
                                {flash?.error && (
                                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                                        {flash.error}
                                    </div>
                                )}
                            </div>
                        )}
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
                                        Manage employee records, departments, and job positions
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <a href="/employees-template/download">
                                    <Button size="sm" variant="outline" className="gap-2">
                                        <Download className="size-4" />
                                        Download Template
                                    </Button>
                                </a>
                                <a href="/employees/export">
                                    <Button size="sm" variant="outline" className="gap-2">
                                        <Download className="size-4" />
                                        Download Employees
                                    </Button>
                                </a>
                                <form
                                    onSubmit={submitImport}
                                    className="flex flex-wrap items-center gap-2"
                                >
                                    <input
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={(e) =>
                                            setData(
                                                'file',
                                                e.currentTarget.files?.[0] ?? null,
                                            )
                                        }
                                        className="block w-[220px] cursor-pointer rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground file:mr-2 file:rounded-sm file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium"
                                    />
                                    <Button
                                        size="sm"
                                        type="submit"
                                        disabled={processing || !data.file}
                                        className="gap-2"
                                    >
                                        <Upload className="size-4" />
                                        Upload
                                    </Button>
                                </form>
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
                        {errors.file && (
                            <p className="mt-2 text-xs text-destructive">{errors.file}</p>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="w-full">
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
                                                <th className="w-32 px-4 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-end gap-0.5">
                                                                <Link
                                                                    href={`${edit({
                                                                        employee: employee.id,
                                                                    }).url}?mode=view`}
                                                                    aria-label="View employee details"
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-8"
                                                                    >
                                                                        <Eye className="size-4" />
                                                                    </Button>
                                                                </Link>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-8"
                                                                    aria-label="View business card"
                                                                    onClick={() => setBusinessCardEmployee(employee)}
                                                                >
                                                                    <CreditCard className="size-4" />
                                                                </Button>
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

            <Dialog open={businessCardEmployee !== null} onOpenChange={(open) => !open && setBusinessCardEmployee(null)}>
                <DialogContent className="sm:max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>
                            {businessCardEmployee
                                ? `${businessCardEmployee.first_name} ${businessCardEmployee.last_name} - Business Card`
                                : 'Business Card'}
                        </DialogTitle>
                    </DialogHeader>
                    {businessCardEmployee ? (
                        <iframe
                            src={`/employees/${businessCardEmployee.id}/business-card/embed`}
                            title="Employee business card"
                            className="h-[75vh] w-full rounded-md border"
                        />
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
