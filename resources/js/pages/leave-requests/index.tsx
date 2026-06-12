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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useI18n } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';
import type { ModulePermissionsMap } from '@/types/permissions';

type Employee = { id: number; first_name: string; last_name: string };
type Department = { id: number; name: string };
type CompanyProfile = { company_name: string };
type LeaveRequest = {
    id: number;
    code: string;
    employee_id: number;
    department_id: number;
    status: string;
    period_from: string | null;
    period_to: string | null;
    days: number | null;
    employee?: Employee & {
        department?: Department;
        companyProfile?: CompanyProfile;
        company_profile?: CompanyProfile;
    };
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
    date_from?: string;
    date_to?: string;
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
    if (params.date_from) {
        cleaned.date_from = params.date_from;
    }
    if (params.date_to) {
        cleaned.date_to = params.date_to;
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
        date_from?: string | null;
        date_to?: string | null;
    };
    departments: Department[];
    stats: LeaveStats;
}) {

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
        if (filters.date_from) {
            q.date_from = filters.date_from;
        }
        if (filters.date_to) {
            q.date_to = filters.date_to;
        }
        return q;
    }, [filters.department_id, filters.status, filters.date_from, filters.date_preset, filters.date_to]);

    const departmentSelectValue =
        filters.department_id != null ? String(filters.department_id) : 'all';

    const statusSelectValue = filters.status && filters.status !== '' ? filters.status : 'all';

    const datePresetSelectValue =
        filters.date_preset && filters.date_preset !== '' ? filters.date_preset : 'all';
    const dateFromValue = filters.date_from && filters.date_from !== '' ? filters.date_from : '';
    const dateToValue = filters.date_to && filters.date_to !== '' ? filters.date_to : '';

    const hasActiveFilters =
        Boolean(filters.search?.trim()) ||
        filters.department_id != null ||
        Boolean(filters.status) ||
        Boolean(filters.date_preset) ||
        Boolean(filters.date_from) ||
        Boolean(filters.date_to);

    const { flash, modulePermissions } = usePage().props as {
        flash?: { success?: string; error?: string };
        modulePermissions?: ModulePermissionsMap;
    };
    const canUpdate = Boolean(modulePermissions?.leave_requests?.can_update);

    const clearAllFilters = () => {
        router.get(LeaveRequestController.index.url(), { page: 1 }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const { t } = useI18n();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('leaveRequests.breadcrumb', 'Leave Management'),
            href: LeaveRequestController.index.url(),
        },
    ];

    const statusFilterOptions = [
        { value: 'draft', label: t('leaveRequests.filterStatus.draft', 'Draft') },
        { value: 'submitted', label: t('leaveRequests.filterStatus.submitted', 'Submitted') },
        { value: 'approved', label: t('leaveRequests.filterStatus.approved', 'Approved') },
        { value: 'rejected', label: t('leaveRequests.filterStatus.rejected', 'Rejected') },
    ];

    const datePresetOptions = [
        { value: 'today', label: t('leaveRequests.datePreset.today', 'Today') },
        { value: 'yesterday', label: t('leaveRequests.datePreset.yesterday', 'Yesterday') },
        { value: 'last_7_days', label: t('leaveRequests.datePreset.last7Days', 'Last 7 days') },
        { value: 'this_month', label: t('leaveRequests.datePreset.thisMonth', 'This month') },
        { value: 'custom', label: t('leaveRequests.datePreset.customRange', 'Custom range') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('leaveRequests.headTitle', 'Leave Requests')} />

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
                                        {t('leaveRequests.heading', 'Leave requests')}
                                    </h1>
                                    <p className="text-muted-foreground mt-0.5 max-w-xl text-sm">
                                        {t(
                                            'leaveRequests.subtitle',
                                            'Track time off, filter by team, and act on submissions from one place.',
                                        )}
                                    </p>
                                </div>
                            </div>
                            <Button asChild className="shrink-0 gap-2 self-start lg:self-center">
                                <Link href={LeaveRequestController.create.url()} prefetch>
                                    <Plus className="size-4" />
                                    {t('leaveRequests.newRequest', 'New request')}
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
                                            {t('leaveRequests.stats.total', 'Total')}
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
                                            {t('leaveRequests.stats.drafts', 'Drafts')}
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
                                            {t('leaveRequests.stats.pendingReview', 'Pending review')}
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
                                            {t('leaveRequests.stats.approved', 'Approved')}
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
                                            {t('leaveRequests.stats.rejected', 'Rejected')}
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
                                    searchPlaceholder={t(
                                        'leaveRequests.searchPlaceholder',
                                        'Search by employee name…',
                                    )}
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
                                                date_from: filters.date_from ?? undefined,
                                                date_to: filters.date_to ?? undefined,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="w-full sm:w-[200px]">
                                            <SelectValue
                                                placeholder={t('leaveRequests.filter.department', 'Department')}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {t('leaveRequests.filter.allDepartments', 'All departments')}
                                            </SelectItem>
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
                                                date_from: filters.date_from ?? undefined,
                                                date_to: filters.date_to ?? undefined,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <SelectValue
                                                placeholder={t('leaveRequests.filter.status', 'Status')}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {t('leaveRequests.filter.allStatuses', 'All statuses')}
                                            </SelectItem>
                                            {statusFilterOptions.map((opt) => (
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
                                                date_from:
                                                    v === 'custom'
                                                        ? filters.date_from ?? undefined
                                                        : undefined,
                                                date_to:
                                                    v === 'custom'
                                                        ? filters.date_to ?? undefined
                                                        : undefined,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="w-full sm:w-[200px]">
                                            <SelectValue placeholder={t('leaveRequests.filter.date', 'Date')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {t('leaveRequests.filter.anyDate', 'Any date')}
                                            </SelectItem>
                                            {datePresetOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {datePresetSelectValue === 'custom' && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <input
                                                type="date"
                                                className="border-input focus-visible:ring-ring h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-[3px] dark:[color-scheme:dark]"
                                                defaultValue={dateFromValue}
                                                onChange={(event) =>
                                                    navigateIndex({
                                                        search: filters.search?.trim() || undefined,
                                                        department_id: filters.department_id ?? undefined,
                                                        status: filters.status ?? undefined,
                                                        date_preset: 'custom',
                                                        date_from: event.target.value || undefined,
                                                        date_to: dateToValue || undefined,
                                                    })
                                                }
                                                aria-label={t('leaveRequests.filter.customDateFrom', 'From date')}
                                            />
                                            <input
                                                type="date"
                                                className="border-input focus-visible:ring-ring h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-[3px] dark:[color-scheme:dark]"
                                                defaultValue={dateToValue}
                                                onChange={(event) =>
                                                    navigateIndex({
                                                        search: filters.search?.trim() || undefined,
                                                        department_id: filters.department_id ?? undefined,
                                                        status: filters.status ?? undefined,
                                                        date_preset: 'custom',
                                                        date_from: dateFromValue || undefined,
                                                        date_to: event.target.value || undefined,
                                                    })
                                                }
                                                aria-label={t('leaveRequests.filter.customDateTo', 'To date')}
                                            />
                                        </div>
                                    )}
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
                                    {t('leaveRequests.clearFilters', 'Clear filters')}
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
                                            <th className="px-4 py-3.5 text-start font-medium">
                                                {t('leaveRequests.table.code', 'Code')}
                                            </th>
                                            <th className="px-4 py-3.5 text-start font-medium">
                                                {t('leaveRequests.table.employee', 'Employee')}
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-start font-medium md:table-cell">
                                                {t('leaveRequests.table.department', 'Department')}
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-start font-medium lg:table-cell">
                                                {t('leaveRequests.table.company', 'Company')}
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-start font-medium lg:table-cell">
                                                {t('leaveRequests.table.period', 'Period')}
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-start font-medium xl:table-cell">
                                                {t('leaveRequests.table.days', 'Days')}
                                            </th>
                                            <th className="px-4 py-3.5 text-start font-medium">
                                                {t('leaveRequests.table.status', 'Status')}
                                            </th>
                                            <th className="w-36 px-4 py-3.5 text-end font-medium">
                                                {t('leaveRequests.table.actions', 'Actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-16 text-center">
                                                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                                                        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                                                            <CalendarDays className="size-7 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-muted-foreground text-sm">
                                                            {hasActiveFilters
                                                                ? t(
                                                                      'leaveRequests.empty.filtered',
                                                                      'No leave requests match your filters.',
                                                                  )
                                                                : t(
                                                                      'leaveRequests.empty.noData',
                                                                      'No leave requests yet. Create the first request to get started.',
                                                                  )}
                                                        </p>
                                                        {!hasActiveFilters && (
                                                            <Button asChild size="sm" variant="outline" className="gap-2">
                                                                <Link href={LeaveRequestController.create.url()}>
                                                                    <Plus className="size-4" />
                                                                    {t('leaveRequests.newRequest', 'New request')}
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
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex rounded-md border border-border/70 bg-muted/30 px-2 py-1 font-mono text-[12px] font-semibold tracking-wide text-foreground sm:text-[13px]">
                                                            {lr.code}
                                                        </span>
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
                                                    <td className="hidden px-4 py-3 lg:table-cell">
                                                        {lr.employee?.company_profile?.company_name
                                                            ?? lr.employee?.companyProfile?.company_name
                                                            ?? '—'}
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
                                                                aria-label={t('leaveRequests.aria.view', 'View')}
                                                            >
                                                                <Button variant="ghost" size="icon" className="size-8">
                                                                    <Eye className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            {canUpdate && lr.status === 'draft' && (
                                                                <Link
                                                                    href={LeaveRequestController.edit.url(lr.id)}
                                                                    aria-label={t('leaveRequests.aria.edit', 'Edit')}
                                                                >
                                                                    <Button variant="ghost" size="icon" className="size-8">
                                                                        <Pencil className="size-4" />
                                                                    </Button>
                                                                </Link>
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
