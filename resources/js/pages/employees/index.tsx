import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import {
    CircleAlert,
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
    user_active?: boolean | null;
    photo_url?: string | null;
    department?: Department;
    job_position?: JobPosition;
};

function AvatarInitial({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
    const initial = name.trim().slice(0, 1).toUpperCase() || '?';
    return (
        <div className="size-8 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
            {photoUrl ? (
                <img src={photoUrl} alt={name} className="size-full object-cover" />
            ) : (
                <span
                    className="flex size-full items-center justify-center bg-primary/10 text-sm font-medium text-primary"
                    aria-hidden
                >
                    {initial}
                </span>
            )}
        </div>
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
    departments,
    filters = {},
}: {
    employees: PaginatedEmployees;
    departments: Department[];
    filters?: { search?: string; department_id?: string | number };
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

    function handleDepartmentFilterChange(value: string) {
        const params: Record<string, string | number> = { page: 1 };
        if (filters.search) {
            params.search = filters.search;
        }
        if (value) {
            params.department_id = value;
        }

        router.get(index().url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />

            <div className="flex min-h-screen flex-1 flex-col bg-background">
                {/* Page header */}
                <div className="border-b bg-gradient-to-b from-muted/40 to-background px-4 py-6 sm:px-6 lg:px-8">
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
                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <Card className="rounded-2xl border bg-card shadow-sm">
                                    <CardContent className="space-y-2 p-4">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Total Employee</span>
                                            <CircleAlert className="size-3.5" />
                                        </div>
                                        <p className="text-3xl font-semibold leading-none">{employees.total}</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">+2 increase from last month</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-2xl border bg-card shadow-sm">
                                    <CardContent className="space-y-2 p-4">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Active Employee</span>
                                            <CircleAlert className="size-3.5" />
                                        </div>
                                        <p className="text-3xl font-semibold leading-none">
                                            {employeeList.filter((emp) => emp.user_id).length}
                                        </p>
                                        <p className="text-xs text-rose-500">-2 decrease from yesterday</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-2xl border bg-card shadow-sm">
                                    <CardContent className="space-y-2 p-4">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Total Department</span>
                                            <CircleAlert className="size-3.5" />
                                        </div>
                                        <p className="text-3xl font-semibold leading-none">
                                            {new Set(employeeList.map((emp) => emp.department?.id).filter(Boolean)).size}
                                        </p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">+1 increase from last year</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-2xl border bg-card shadow-sm">
                                    <CardContent className="space-y-2 p-4">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>This Page</span>
                                            <CircleAlert className="size-3.5" />
                                        </div>
                                        <p className="text-3xl font-semibold leading-none">{employeeList.length}</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Current visible records</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                        {errors.file && (
                            <p className="mt-2 text-xs text-destructive">{errors.file}</p>
                        )}
                    </div>
                </div>

                {/* Employee list table */}
                <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
                    <div className="w-full">
                        <Card className="overflow-hidden rounded-2xl border shadow-sm">
                            <CardContent className="p-0">
                                <div className="border-b px-4 py-4 sm:px-5">
                                    <h2 className="text-lg font-semibold tracking-tight">Employee List</h2>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3 sm:px-5">
                                    <DataTableToolbar
                                        searchUrl={index().url}
                                        searchPlaceholder="Search employee..."
                                        filters={filters}
                                        persistQuery={{ department_id: filters.department_id }}
                                        autoSearch
                                        showSearchButton={false}
                                    />
                                    <select
                                        value={String(filters.department_id ?? '')}
                                        onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                                        className="h-9 rounded-full border border-input bg-background px-3 text-sm text-foreground shadow-sm"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map((department) => (
                                            <option key={department.id} value={department.id}>
                                                {department.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="ml-auto flex flex-wrap items-center gap-2">
                                        <a href="/employees-template/download">
                                            <Button size="sm" variant="outline" className="h-9 gap-2 rounded-full px-3">
                                                <Download className="size-4" />
                                                Template
                                            </Button>
                                        </a>
                                        <a href="/employees/export">
                                            <Button size="sm" variant="outline" className="h-9 gap-2 rounded-full px-3">
                                                <Download className="size-4" />
                                                Export
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
                                                className="block w-[170px] cursor-pointer rounded-full border border-input bg-background px-2.5 py-1.5 text-xs text-foreground file:mr-2 file:rounded-full file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-xs file:font-medium"
                                            />
                                            <Button
                                                size="sm"
                                                type="submit"
                                                disabled={processing || !data.file}
                                                className="h-9 gap-2 rounded-full px-3"
                                            >
                                                <Upload className="size-4" />
                                                Upload
                                            </Button>
                                        </form>
                                        <Link href={create().url}>
                                            <Button size="sm" className="h-9 gap-2 rounded-full px-3">
                                                <Plus className="size-4" />
                                                Add Employee
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[980px] text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="w-14 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:px-5">
                                                    #
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:px-5">
                                                    Name
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Mail
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Department
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Role
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Contact
                                                </th>
                                                <th className="w-40 px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground sm:pr-5">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                {employeeList.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="px-4 py-16 text-center sm:px-5"
                                                >
                                                    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
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
                                                            <p className="text-sm text-muted-foreground">
                                                                {filters.search
                                                                    ? 'Try a different search term or clear the filter.'
                                                                    : 'Add your first employee to get started.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                ) : (
                                            employeeList.map((employee, indexOnPage) => (
                                                <tr
                                                key={employee.id}
                                                    className="border-b transition-colors hover:bg-muted/25"
                                            >
                                                    <td className="px-4 py-3 text-xs font-medium text-muted-foreground sm:px-5">
                                                        {Math.max((employees.from ?? 1) + indexOnPage, 1)}
                                                    </td>
                                                    <td className="px-4 py-3 sm:px-5">
                                                        <div className="flex items-center gap-2.5">
                                                            <AvatarInitial
                                                                name={employee.first_name}
                                                                photoUrl={employee.photo_url}
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium">
                                                                    {employee.first_name} {employee.last_name}
                                                                </p>
                                                                <p className="font-mono text-[11px] text-muted-foreground">
                                                                    {employee.employee_code}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        <p className="max-w-[220px] truncate">{employee.email_address}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-700 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-300">
                                                            {employee.department?.name ?? '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {employee.job_position?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {employee.user_id && employee.user_active !== false ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                                                                <Key className="size-3" />
                                                                Active
                                                            </span>
                                                        ) : employee.user_id && employee.user_active === false ? (
                                                            <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
                                                                Inactive
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {employee.contact_number ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 sm:pr-5">
                                                        <div className="flex justify-end gap-0.5 rounded-lg border bg-background p-0.5">
                                                            <Link
                                                                href={`${edit({
                                                                    employee: employee.id,
                                                                }).url}?mode=view`}
                                                                aria-label="View employee details"
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-8 rounded-md"
                                                                >
                                                                    <Eye className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 rounded-md"
                                                                aria-label="View business card"
                                                                onClick={() => setBusinessCardEmployee(employee)}
                                                            >
                                                                <CreditCard className="size-4" />
                                                            </Button>
                                                            <Link
                                                                href={edit({
                                                                    employee: employee.id,
                                                                }).url}
                                                                aria-label="Edit"
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-8 rounded-md"
                                                                >
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-8 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="border-t">
                                    <DataTablePagination
                                        links={employees.links}
                                        from={employees.from}
                                        to={employees.to}
                                        total={employees.total}
                                    />
                                </div>
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
