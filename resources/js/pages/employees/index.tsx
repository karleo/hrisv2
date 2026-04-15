import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    CircleAlert,
    CreditCard,
    Download,
    Eye,
    Grid2x2,
    List,
    Mail,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
    Users,
} from 'lucide-react';
import { Fragment, type FormEvent, useState } from 'react';
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
    managerEmployee?: {
        id: number;
        first_name: string;
        last_name: string;
    } | null;
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
    employee_status?:
        | 'Employed'
        | 'Active'
        | 'On Probation'
        | 'Resigned'
        | 'Serving Notice Period'
        | 'Terminated'
        | 'Absconded'
        | 'Suspended'
        | 'Employment Cancelled'
        | null;
    photo_url?: string | null;
    department?: Department;
    job_position?: JobPosition;
};

const employeeStatusStyleMap: Record<string, string> = {
    Employed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300',
    Active: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300',
    'On Probation': 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300',
    Resigned: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300',
    'Serving Notice Period': 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-300',
    Terminated: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300',
    Absconded: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300',
    Suspended: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/40 dark:bg-purple-900/20 dark:text-purple-300',
    'Employment Cancelled': 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300',
};

const departmentStyleMap: Record<string, string> = {
    Sales: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-300',
    Operations: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-300',
    Engineering: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-900/20 dark:text-violet-300',
    Finance: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300',
    Marketing: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300',
    'Human Resources': 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300',
};

function AvatarInitial({
    name,
    photoUrl,
    sizeClass = 'size-8',
    roundedClass = 'rounded-full',
    initialTextClassName = 'text-sm',
}: {
    name: string;
    photoUrl?: string | null;
    sizeClass?: string;
    roundedClass?: string;
    /** Typography for the letter fallback (match larger `sizeClass` on grid cards). */
    initialTextClassName?: string;
}) {
    const initial = name.trim().slice(0, 1).toUpperCase() || '?';
    return (
        <div className={`${sizeClass} ${roundedClass} shrink-0 overflow-hidden border border-border/60 bg-muted`}>
            {photoUrl ? (
                <img src={photoUrl} alt={name} className="size-full object-cover" />
            ) : (
                <span
                    className={`flex size-full items-center justify-center bg-primary/10 font-medium text-primary ${initialTextClassName}`}
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
    stats,
    filters = {},
}: {
    employees: PaginatedEmployees;
    stats: {
        totalEmployees: number;
        activeEmployees: number;
        totalDepartments: number;
        noLoginAccessEmployees: number;
    };
    filters?: { search?: string; department_id?: string | number; employee_status?: string };
}) {
    const { data: employeeList } = employees;
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const [businessCardEmployee, setBusinessCardEmployee] = useState<Employee | null>(null);
    const [groupMode, setGroupMode] = useState<'none' | 'department' | 'manager'>('none');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const { data, setData, post, processing, errors, reset } = useForm<{ file: File | null }>({
        file: null,
    });
    const groupedEmployees = employeeList.reduce<Record<string, Employee[]>>((groups, employee) => {
        const managerName = employee.department?.managerEmployee
            ? `${employee.department.managerEmployee.first_name} ${employee.department.managerEmployee.last_name}`
            : 'No Manager Assigned';
        const groupName = groupMode === 'manager'
            ? managerName
            : employee.department?.name ?? 'Undefined';
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(employee);
        return groups;
    }, {});
    const sortedGroupNames = Object.keys(groupedEmployees).sort((a, b) => a.localeCompare(b));
    const exportQuery = new URLSearchParams();
    if (filters.search) {
        exportQuery.set('search', String(filters.search));
    }
    if (filters.employee_status) {
        exportQuery.set('employee_status', String(filters.employee_status));
    }
    if (filters.department_id) {
        exportQuery.set('department_id', String(filters.department_id));
    }
    if (groupMode !== 'none') {
        exportQuery.set('group_by', groupMode);
    }
    const exportHref = `/employees/export${exportQuery.size > 0 ? `?${exportQuery.toString()}` : ''}`;

    function toggleGroup(groupName: string) {
        setExpandedGroups((previous) => ({
            ...previous,
            [groupName]: !(previous[groupName] ?? true),
        }));
    }

    function submitImport(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post('/employees/import', {
            forceFormData: true,
            onSuccess: () => reset('file'),
        });
    }

    function handleStatusFilterChange(value: string) {
        const params: Record<string, string | number> = { page: 1 };
        if (filters.search) {
            params.search = filters.search;
        }
        if (value) {
            params.employee_status = value;
        }

        router.get(index().url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function openEmployeeView(employeeId: number) {
        router.visit(`${edit({ employee: employeeId }).url}?mode=view`);
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
                                <Card className="rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
                                    <CardContent className="space-y-2 p-4">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Total Employee</span>
                                            <CircleAlert className="size-3.5" />
                                        </div>
                                        <p className="text-3xl font-semibold leading-none">{stats.totalEmployees}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.totalEmployees === 0
                                                ? 'No employees yet'
                                                : 'Current total employee records'}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
                                    <CardContent className="space-y-2 p-4">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Active Employee</span>
                                            <CircleAlert className="size-3.5" />
                                        </div>
                                        <p className="text-3xl font-semibold leading-none">{stats.activeEmployees}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.activeEmployees === 0
                                                ? 'No active employee accounts'
                                                : 'Employees with active login access'}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
                                    <CardContent className="space-y-2 p-4">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Total Department</span>
                                            <CircleAlert className="size-3.5" />
                                        </div>
                                        <p className="text-3xl font-semibold leading-none">{stats.totalDepartments}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.totalDepartments === 0
                                                ? 'No departments configured'
                                                : 'Configured departments in the system'}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
                                    <CardContent className="space-y-2 p-4">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>No Login Access</span>
                                            <CircleAlert className="size-3.5" />
                                        </div>
                                        <p className="text-3xl font-semibold leading-none">
                                            {stats.noLoginAccessEmployees}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.noLoginAccessEmployees === 0
                                                ? 'All employees have login access'
                                                : 'Employees pending login access'}
                                        </p>
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
                                <div className="border-b bg-muted/20 px-4 py-4 sm:px-5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h2 className="text-lg font-semibold tracking-tight">Employee List</h2>
                                            <p className="text-xs text-muted-foreground">
                                                Search, group, and manage employees quickly.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-full border bg-background p-1">
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        type="button"
                                                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                                                        className="size-8 rounded-full p-0"
                                                        aria-label="Table view"
                                                        title="Table view"
                                                        onClick={() => setViewMode('table')}
                                                    >
                                                        <List className="size-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        type="button"
                                                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                                        className="size-8 rounded-full p-0"
                                                        aria-label="Grid view"
                                                        title="Grid view"
                                                        onClick={() => setViewMode('grid')}
                                                    >
                                                        <Grid2x2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="rounded-full border bg-background p-1">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    type="button"
                                                    variant={groupMode === 'department' ? 'default' : 'ghost'}
                                                    className="h-8 rounded-full px-3 text-xs"
                                                    onClick={() => setGroupMode((value) => (value === 'department' ? 'none' : 'department'))}
                                                >
                                                    By Department
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    type="button"
                                                    variant={groupMode === 'manager' ? 'default' : 'ghost'}
                                                    className="h-8 rounded-full px-3 text-xs"
                                                    onClick={() => setGroupMode((value) => (value === 'manager' ? 'none' : 'manager'))}
                                                >
                                                    By Manager
                                                </Button>
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 border-b bg-background/70 px-4 py-3 sm:px-5">
                                    <DataTableToolbar
                                        searchUrl={index().url}
                                        searchPlaceholder="Search employee..."
                                        filters={filters}
                                        persistQuery={{ employee_status: filters.employee_status }}
                                        autoSearch
                                        showSearchButton={false}
                                    />
                                    <select
                                        value={filters.employee_status ?? ''}
                                        onChange={(e) => handleStatusFilterChange(e.target.value)}
                                        className="h-9 rounded-full border border-input bg-background px-3 text-sm text-foreground shadow-sm"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Employed">Employed</option>
                                        <option value="On Probation">On Probation</option>
                                        <option value="Resigned">Resigned</option>
                                        <option value="Serving Notice Period">Serving Notice Period</option>
                                        <option value="Terminated">Terminated</option>
                                        <option value="Absconded">Absconded</option>
                                        <option value="Suspended">Suspended</option>
                                        <option value="Employment Cancelled">Employment Cancelled</option>
                                    </select>
                                    <div className="ml-auto flex flex-wrap items-center gap-2">
                                        {viewMode === 'table' && groupMode !== 'none' ? (
                                            <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                                {groupMode === 'department' ? 'Grouped by Department' : 'Grouped by Manager'}
                                            </span>
                                        ) : null}
                                        <a href="/employees-template/download">
                                            <Button size="sm" variant="outline" className="h-9 gap-2 rounded-full px-3">
                                                <Download className="size-4" />
                                                Template
                                            </Button>
                                        </a>
                                        <a href={exportHref}>
                                            <Button size="sm" variant="outline" className="h-9 gap-2 rounded-full px-3">
                                                <Download className="size-4" />
                                                Export
                                            </Button>
                                        </a>
                                        <form
                                            onSubmit={submitImport}
                                            className="flex flex-wrap items-center gap-2 rounded-full border border-border/70 bg-muted/20 p-1"
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
                                {viewMode === 'table' ? (
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
                                            groupMode === 'none' && employeeList.map((employee, indexOnPage) => (
                                                <tr
                                                key={employee.id}
                                                    className="border-b odd:bg-muted/10 transition-colors hover:bg-muted/25"
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
                                                        {(() => {
                                                            const departmentName = employee.department?.name ?? '—';
                                                            const departmentStyle = departmentStyleMap[departmentName]
                                                                ?? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-300';

                                                            return (
                                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${departmentStyle}`}>
                                                            {departmentName}
                                                        </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {employee.job_position?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {(() => {
                                                            const normalizedStatus = employee.employee_status === 'Active'
                                                                ? 'Employed'
                                                                : (employee.employee_status ?? 'Employed');

                                                            return (
                                                                <span
                                                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
                                                                employeeStatusStyleMap[normalizedStatus] ??
                                                                'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300'
                                                            }`}
                                                        >
                                                            {normalizedStatus}
                                                        </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {employee.contact_number ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 sm:pr-5">
                                                        <div className="flex justify-end gap-0.5 rounded-full border bg-background p-0.5 shadow-xs">
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
                                        {employeeList.length > 0 && groupMode !== 'none' && (
                                            sortedGroupNames.map((groupName) => {
                                                const groupItems = groupedEmployees[groupName] ?? [];
                                                const isExpanded = expandedGroups[groupName] ?? true;

                                                return (
                                                    <Fragment key={`group-wrap-${groupName}`}>
                                                        <tr
                                                            key={`group-${groupName}`}
                                                            className="cursor-pointer border-b bg-muted/35 hover:bg-muted/50"
                                                            onClick={() => toggleGroup(groupName)}
                                                        >
                                                            <td className="px-4 py-3 text-muted-foreground sm:px-5">
                                                                <ChevronRight
                                                                    className={`size-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                                />
                                                            </td>
                                                            <td colSpan={7} className="px-4 py-3 font-medium sm:px-5">
                                                                {groupName} ({groupItems.length})
                                                            </td>
                                                        </tr>
                                                        {isExpanded && groupItems.map((employee) => (
                                                            <tr
                                                                key={employee.id}
                                                            className="border-b bg-background/60 odd:bg-muted/10 transition-colors hover:bg-muted/20"
                                                            >
                                                                <td className="px-4 py-3 text-xs text-muted-foreground sm:px-5">•</td>
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
                                                                    {(() => {
                                                                        const departmentName = employee.department?.name ?? '—';
                                                                        const departmentStyle = departmentStyleMap[departmentName]
                                                                            ?? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-300';

                                                                        return (
                                                                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${departmentStyle}`}>
                                                                        {departmentName}
                                                                    </span>
                                                                        );
                                                                    })()}
                                                                </td>
                                                                <td className="px-4 py-3 text-muted-foreground">
                                                                    {employee.job_position?.name ?? '—'}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {(() => {
                                                                        const normalizedStatus = employee.employee_status === 'Active'
                                                                            ? 'Employed'
                                                                            : (employee.employee_status ?? 'Employed');

                                                                        return (
                                                                            <span
                                                                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
                                                                                    employeeStatusStyleMap[normalizedStatus] ??
                                                                                    'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300'
                                                                                }`}
                                                                            >
                                                                                {normalizedStatus}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </td>
                                                                <td className="px-4 py-3 text-muted-foreground">
                                                                    {employee.contact_number ?? '—'}
                                                                </td>
                                                                <td className="px-4 py-3 sm:pr-5">
                                                                    <div className="flex justify-end gap-0.5 rounded-full border bg-background p-0.5 shadow-xs">
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
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </Fragment>
                                                );
                                            })
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
                                        {employeeList.map((employee) => {
                                            const normalizedStatus = employee.employee_status === 'Active'
                                                ? 'Employed'
                                                : (employee.employee_status ?? 'Employed');
                                            const departmentName = employee.department?.name ?? 'Undefined';

                                            return (
                                                <Card
                                                    key={employee.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => openEmployeeView(employee.id)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault();
                                                            openEmployeeView(employee.id);
                                                        }
                                                    }}
                                                    className="cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/70 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                                                >
                                                    <div className="relative h-14 bg-gradient-to-r from-primary/62 via-primary/36 to-transparent dark:from-indigo-500/58 dark:via-indigo-500/30 dark:to-transparent">
                                                        <span className="absolute right-3 top-2 rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:border-slate-600 dark:bg-slate-900/85 dark:text-slate-200">
                                                            {employee.employee_code}
                                                        </span>
                                                    </div>
                                                    <CardContent className="relative pt-0">
                                                        <div className="-mt-12 flex justify-center">
                                                            <div className="rounded-lg border-2 border-background shadow-sm dark:border-slate-800">
                                                                <AvatarInitial
                                                                    name={`${employee.first_name} ${employee.last_name}`}
                                                                    photoUrl={employee.photo_url}
                                                                    sizeClass="h-28 w-24"
                                                                    roundedClass="rounded-lg"
                                                                    initialTextClassName="text-lg"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="mt-0.5 space-y-1.5 text-center">
                                                            <p className="text-base font-semibold leading-none">
                                                                {employee.first_name} {employee.last_name}
                                                            </p>
                                                            <p className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                                                <Mail className="size-3.5" />
                                                                <span className="truncate">{employee.email_address}</span>
                                                            </p>
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${departmentStyleMap[departmentName] ?? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-300'}`}>
                                                                    {departmentName}
                                                                </span>
                                                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${employeeStatusStyleMap[normalizedStatus] ?? 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300'}`}>
                                                                    {normalizedStatus}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="mt-3 flex justify-center gap-1 border-t pt-2.5 dark:border-slate-700/70"
                                                            onClick={(event) => event.stopPropagation()}
                                                            onKeyDown={(event) => event.stopPropagation()}
                                                        >
                                                            <Link href={`${edit({ employee: employee.id }).url}?mode=view`}>
                                                                <Button variant="ghost" size="icon" className="size-8 rounded-md">
                                                                    <Eye className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 rounded-md"
                                                                onClick={() => setBusinessCardEmployee(employee)}
                                                            >
                                                                <CreditCard className="size-4" />
                                                            </Button>
                                                            <Link href={edit({ employee: employee.id }).url}>
                                                                <Button variant="ghost" size="icon" className="size-8 rounded-md">
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}

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
