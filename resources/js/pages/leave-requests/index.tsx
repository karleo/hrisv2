import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Eye,
    FileText,
    Pencil,
    Plus,
    Send,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useMemo } from 'react';
import LeaveRequestController from '@/actions/App/Http/Controllers/LeaveRequestController';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { RequestStatusBadge } from '@/components/request-status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRequestStatusPoll } from '@/hooks/use-request-status-poll';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ModulePermissionsMap } from '@/types/permissions';

type Employee = { id: number; first_name: string; last_name: string };
type Department = { id: number; name: string };
type LeaveRequest = {
    id: number;
    code: string;
    employee_id: number;
    department_id: number;
    status: string;
    period_from: string | null;
    period_to: string | null;
    days: number | null;
    employee?: Employee & { department?: Department };
    department?: Department;
};

type PaginatedLeaveRequests = {
    data: LeaveRequest[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type LeaveStats = {
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leave Management', href: LeaveRequestController.index.url() },
];

const STATUS_FILTER_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
] as const;

const DATE_PRESET_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 days' },
    { value: 'this_month', label: 'This month' },
] as const;

function formatDateDdMmYyyy(value: string | null | undefined): string {
    if (value == null || value === '') return '—';
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [, yyyy, mm, dd] = match;
        return `${dd}/${mm}/${yyyy}`;
    }
    return value;
}

function employeeInitials(employee: Employee | undefined): string {
    if (!employee) return '?';
    const a = employee.first_name?.charAt(0) ?? '';
    const b = employee.last_name?.charAt(0) ?? '';
    const s = `${a}${b}`.toUpperCase();
    return s.length > 0 ? s : '?';
}

function navigateIndex(params: {
    search?: string;
    department_id?: number;
    status?: string;
    date_preset?: string;
}) {
    const cleaned: Record<string, string | number> = { page: 1 };
    if (params.search?.trim()) {
        cleaned.search = params.search.trim();
    }
    if (params.department_id != null) {
        cleaned.department_id = params.department_id;
    }
    if (params.status) {
        cleaned.status = params.status;
    }
    if (params.date_preset) {
        cleaned.date_preset = params.date_preset;
    }
    router.get(LeaveRequestController.index.url(), cleaned, {
        preserveState: true,
        preserveScroll: true,
    });
}

export default function LeaveRequestsIndex({
    leaveRequests,
    filters,
    departments,
    stats,
}: {
    leaveRequests: PaginatedLeaveRequests;
    filters: {
        search?: string | null;
        department_id?: number | null;
        status?: string | null;
        date_preset?: string | null;
    };
    departments: Department[];
    stats: LeaveStats;
}) {
    useRequestStatusPoll(['leaveRequests', 'stats']);

    const { data: items } = leaveRequests;

    const persistQuery = useMemo(() => {
        const q: Record<string, string | number> = {};
        if (filters.department_id != null) {
            q.department_id = filters.department_id;
        }
        if (filters.status) {
            q.status = filters.status;
        }
        if (filters.date_preset) {
            q.date_preset = filters.date_preset;
        }
        return q;
    }, [filters.department_id, filters.status, filters.date_preset]);

    const departmentSelectValue =
        filters.department_id != null ? String(filters.department_id) : 'all';

    const statusSelectValue = filters.status && filters.status !== '' ? filters.status : 'all';

    const datePresetSelectValue =
        filters.date_preset && filters.date_preset !== '' ? filters.date_preset : 'all';

    const hasActiveFilters =
        Boolean(filters.search?.trim()) ||
        filters.department_id != null ||
        Boolean(filters.status) ||
        Boolean(filters.date_preset);

    const { flash, modulePermissions } = usePage().props as {
        flash?: { success?: string; error?: string };
        modulePermissions?: ModulePermissionsMap;
    };
    const canUpdate = Boolean(modulePermissions?.leave_requests?.can_update);
    const canDelete = Boolean(modulePermissions?.leave_requests?.can_delete);

    const clearAllFilters = () => {
        router.get(LeaveRequestController.index.url(), { page: 1 }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Requests" />

            <div className="flex h-full flex-1 flex-col">
                <div className="border-b bg-gradient-to-b from-muted/30 to-background px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6">
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
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
                                    <CalendarDays className="size-5 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                                        Leave requests
                                    </h1>
                                    <p className="text-muted-foreground mt-0.5 max-w-xl text-sm">
                                        Track time off, filter by team, and act on submissions from one place.
                                    </p>
                                </div>
                            </div>
                            <Button asChild className="shrink-0 gap-2 self-start lg:self-center">
                                <Link href={LeaveRequestController.create.url()} prefetch>
                                    <Plus className="size-4" />
                                    New request
                                </Link>
                            </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            <Card className="border shadow-sm">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                        <ClipboardList className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                            Total
                                        </p>
                                        <p className="text-2xl font-semibold tabular-nums">{stats.total}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border shadow-sm">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/15">
                                        <FileText className="size-5 text-amber-700 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                            Drafts
                                        </p>
                                        <p className="text-2xl font-semibold tabular-nums">{stats.draft}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border shadow-sm">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-sky-500/15">
                                        <Send className="size-5 text-sky-700 dark:text-sky-400" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                            Pending review
                                        </p>
                                        <p className="text-2xl font-semibold tabular-nums">{stats.submitted}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border shadow-sm">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/15">
                                        <CheckCircle2 className="size-5 text-emerald-700 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                            Approved
                                        </p>
                                        <p className="text-2xl font-semibold tabular-nums">{stats.approved}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border shadow-sm sm:col-span-2 xl:col-span-1">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/15">
                                        <XCircle className="size-5 text-red-700 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                            Rejected
                                        </p>
                                        <p className="text-2xl font-semibold tabular-nums">{stats.rejected}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                <DataTableToolbar
                                    searchUrl={LeaveRequestController.index.url()}
                                    searchPlaceholder="Search by employee name…"
                                    filters={{ search: filters.search ?? undefined }}
                                    persistQuery={persistQuery}
                                    autoSearch
                                    showSearchButton={false}
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                        value={departmentSelectValue}
                                        onValueChange={(v) => {
                                            navigateIndex({
                                                search: filters.search?.trim() || undefined,
                                                department_id: v === 'all' ? undefined : Number(v),
                                                status: filters.status ?? undefined,
                                                date_preset: filters.date_preset ?? undefined,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="w-full sm:w-[200px]">
                                            <SelectValue placeholder="Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All departments</SelectItem>
                                            {departments.map((d) => (
                                                <SelectItem key={d.id} value={String(d.id)}>
                                                    {d.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={statusSelectValue}
                                        onValueChange={(v) => {
                                            navigateIndex({
                                                search: filters.search?.trim() || undefined,
                                                department_id: filters.department_id ?? undefined,
                                                status: v === 'all' ? undefined : v,
                                                date_preset: filters.date_preset ?? undefined,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All statuses</SelectItem>
                                            {STATUS_FILTER_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={datePresetSelectValue}
                                        onValueChange={(v) => {
                                            navigateIndex({
                                                search: filters.search?.trim() || undefined,
                                                department_id: filters.department_id ?? undefined,
                                                status: filters.status ?? undefined,
                                                date_preset: v === 'all' ? undefined : v,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="w-full sm:w-[200px]">
                                            <SelectValue placeholder="Date" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Any date</SelectItem>
                                            {DATE_PRESET_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={clearAllFilters}
                                >
                                    Clear filters
                                </Button>
                            )}
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
                                            <th className="px-4 py-3.5 text-left font-medium">Code</th>
                                            <th className="px-4 py-3.5 text-left font-medium">Employee</th>
                                            <th className="hidden px-4 py-3.5 text-left font-medium md:table-cell">
                                                Department
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-left font-medium lg:table-cell">
                                                Period
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-left font-medium xl:table-cell">
                                                Days
                                            </th>
                                            <th className="px-4 py-3.5 text-left font-medium">Status</th>
                                            <th className="w-36 px-4 py-3.5 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-16 text-center">
                                                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                                                        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                                                            <CalendarDays className="size-7 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-muted-foreground text-sm">
                                                            {hasActiveFilters
                                                                ? 'No leave requests match your filters.'
                                                                : 'No leave requests yet. Create the first request to get started.'}
                                                        </p>
                                                        {!hasActiveFilters && (
                                                            <Button asChild size="sm" variant="outline" className="gap-2">
                                                                <Link href={LeaveRequestController.create.url()}>
                                                                    <Plus className="size-4" />
                                                                    New request
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map((lr) => (
                                                <tr
                                                    key={lr.id}
                                                    className="border-b transition-colors hover:bg-muted/30 last:border-0"
                                                >
                                                    <td className="px-4 py-3 font-mono text-xs font-medium sm:text-sm">
                                                        {lr.code}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="size-9 border border-border/60">
                                                                <AvatarFallback className="text-xs font-medium">
                                                                    {employeeInitials(lr.employee)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium">
                                                                    {lr.employee
                                                                        ? `${lr.employee.first_name} ${lr.employee.last_name}`
                                                                        : '—'}
                                                                </p>
                                                                <p className="text-muted-foreground truncate text-xs md:hidden">
                                                                    {lr.department?.name ?? '—'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="hidden px-4 py-3 md:table-cell">
                                                        {lr.department?.name ?? '—'}
                                                    </td>
                                                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                                                        {lr.period_from && lr.period_to
                                                            ? `${formatDateDdMmYyyy(lr.period_from)} – ${formatDateDdMmYyyy(lr.period_to)}`
                                                            : '—'}
                                                    </td>
                                                    <td className="hidden px-4 py-3 tabular-nums xl:table-cell">
                                                        {lr.days ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <RequestStatusBadge
                                                            status={lr.status}
                                                            className="px-2.5 py-0.5"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-end gap-1">
                                                            <Link
                                                                href={LeaveRequestController.show.url(lr.id)}
                                                                aria-label="View"
                                                            >
                                                                <Button variant="ghost" size="icon" className="size-8">
                                                                    <Eye className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            {canUpdate && (
                                                                <Link
                                                                    href={LeaveRequestController.edit.url(lr.id)}
                                                                    aria-label="Edit"
                                                                >
                                                                    <Button variant="ghost" size="icon" className="size-8">
                                                                        <Pencil className="size-4" />
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                            {canDelete && (
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
                                                                        <DialogTitle>Delete leave request?</DialogTitle>
                                                                        <DialogDescription>
                                                                            This will permanently remove{' '}
                                                                            <strong>{lr.code}</strong>
                                                                            {lr.employee
                                                                                ? ` for ${lr.employee.first_name} ${lr.employee.last_name}`
                                                                                : ''}
                                                                            . This cannot be undone.
                                                                        </DialogDescription>
                                                                        <DialogFooter>
                                                                            <DialogClose asChild>
                                                                                <Button variant="secondary">Cancel</Button>
                                                                            </DialogClose>
                                                                            <Button
                                                                                variant="destructive"
                                                                                onClick={() =>
                                                                                    router.delete(
                                                                                        LeaveRequestController.destroy.url(
                                                                                            lr.id,
                                                                                        ),
                                                                                    )
                                                                                }
                                                                            >
                                                                                Delete
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <DataTablePagination
                                links={leaveRequests.links}
                                from={leaveRequests.from}
                                to={leaveRequests.to}
                                total={leaveRequests.total}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
