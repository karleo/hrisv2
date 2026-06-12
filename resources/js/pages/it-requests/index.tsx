import { Head, Link, usePage } from '@inertiajs/react';
import {
    Eye,
    FileText,
    Monitor,
    Pencil,
    Plus,
    Printer,
} from 'lucide-react';
import ItRequestController from '@/actions/App/Http/Controllers/ItRequestController';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { RequestStatusBadge } from '@/components/request-status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useI18n } from '@/lib/i18n';
import { create, index } from '@/routes/it-requests';
import type { BreadcrumbItem } from '@/types';
import type { ModulePermissionsMap } from '@/types/permissions';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    company_profile?: { company_name: string };
    companyProfile?: { company_name: string };
};

type Department = {
    id: number;
    name: string;
};

type ItRequest = {
    id: number;
    employee_id: number;
    department_id: number;
    status: string;
    employee?: Employee;
    department?: Department;
};

type PaginatedItRequests = {
    data: ItRequest[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

export default function Index({
    itRequests,
    filters = {},
}: {
    itRequests: PaginatedItRequests;
    filters?: { search?: string };
}) {

    const { data: requestList } = itRequests;
    const { flash, modulePermissions } = usePage().props as {
        flash?: { success?: string; error?: string };
        modulePermissions?: ModulePermissionsMap;
    };
    const canUpdate = Boolean(modulePermissions?.it_requests?.can_update);

    const { t } = useI18n();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('sidebar.itRequests', 'IT Requests'),
            href: index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('sidebar.itRequests', 'IT Requests')} />

            <div className="flex h-full flex-1 flex-col">
                {/* Page header */}
                <div className="border-b bg-gradient-to-b from-muted/30 to-background px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4">
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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                <Monitor className="size-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                                    {t('sidebar.itRequests', 'IT Requests')}
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    {t(
                                        'itRequestsIndex.subtitle',
                                        'View and manage submitted IT requests',
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <DataTableToolbar
                                searchUrl={index().url}
                                searchPlaceholder={t(
                                    'itRequestsIndex.searchPlaceholder',
                                    'Search by employee...',
                                )}
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href={create().url}>
                                <Button size="sm" className="gap-2">
                                    <Plus className="size-4" />
                                    {t('itRequestsIndex.newRequest', 'New Request')}
                                </Button>
                            </Link>
                        </div>
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
                                                {t('itRequestsIndex.table.employee', 'Employee')}
                                            </th>
                                            <th className="px-4 py-3.5 text-start font-medium">
                                                {t('itRequestsIndex.table.department', 'Department')}
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-start font-medium lg:table-cell">
                                                {t('itRequestsIndex.table.company', 'Company')}
                                            </th>
                                            <th className="px-4 py-3.5 text-start font-medium">
                                                {t('itRequestsIndex.table.status', 'Status')}
                                            </th>
                                            <th className="w-36 px-4 py-3.5 text-end font-medium">
                                                {t('itRequestsIndex.table.actions', 'Actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requestList.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-4 py-16 text-center"
                                                >
                                                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                                                        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                                                            <FileText className="size-7 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-muted-foreground text-sm">
                                                            {filters.search
                                                                ? t(
                                                                      'itRequestsIndex.empty.search',
                                                                      'No IT requests match your search.',
                                                                  )
                                                                : t(
                                                                      'itRequestsIndex.empty.noData',
                                                                      'No IT requests yet. Create your first request to get started.',
                                                                  )}
                                                        </p>
                                                        {!filters.search && (
                                                            <Link href={create().url}>
                                                                <Button size="sm" variant="outline" className="gap-2">
                                                                    <Plus className="size-4" />
                                                                    {t(
                                                                        'itRequestsIndex.newItRequest',
                                                                        'New IT Request',
                                                                    )}
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            requestList.map((request) => (
                                                <tr
                                                    key={request.id}
                                                    className="border-b transition-colors hover:bg-muted/30 last:border-0"
                                                >
                                                    <td className="px-4 py-3">
                                                        {request.employee
                                                            ? `${request.employee.first_name} ${request.employee.last_name}`
                                                            : '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {request.department?.name ?? '—'}
                                                    </td>
                                                    <td className="hidden px-4 py-3 lg:table-cell">
                                                        {request.employee?.company_profile?.company_name
                                                            ?? request.employee?.companyProfile?.company_name
                                                            ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <RequestStatusBadge
                                                            status={request.status}
                                                            className="px-2.5 py-0.5"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-end gap-1">
                                                            <Link
                                                                href={ItRequestController.show.url(request.id)}
                                                                aria-label={t('itRequestsIndex.aria.view', 'View')}
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-8"
                                                                >
                                                                    <Eye className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            <Link
                                                                href={`/it-requests/${request.id}/print`}
                                                                aria-label={t('itRequestsIndex.aria.print', 'Print')}
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-8"
                                                                >
                                                                    <Printer className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            {canUpdate && request.status === 'draft' && (
                                                                <Link
                                                                    href={ItRequestController.edit.url(request.id)}
                                                                    aria-label={t('itRequestsIndex.aria.edit', 'Edit')}
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-8"
                                                                    >
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
                                links={itRequests.links}
                                from={itRequests.from}
                                to={itRequests.to}
                                total={itRequests.total}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
