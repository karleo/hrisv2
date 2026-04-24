import { Head, Link, usePage } from '@inertiajs/react';
import {
    Eye,
    FileText,
    HardDrive,
    Pencil,
    Plus,
    Printer,
} from 'lucide-react';
import ItAssetRequestController from '@/actions/App/Http/Controllers/ItAssetRequestController';
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
import { create, index } from '@/routes/it-asset-requests';
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

type ItAssetRequest = {
    id: number;
    code: string;
    date: string;
    status: string;
    employee?: Employee;
    department?: Department;
};

type PaginatedItAssetRequests = {
    data: ItAssetRequest[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
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

export default function Index({
    itAssetRequests,
    filters = {},
}: {
    itAssetRequests: PaginatedItAssetRequests;
    filters?: { search?: string };
}) {

    const { data: requestList } = itAssetRequests;
    const { flash, modulePermissions } = usePage().props as {
        flash?: { success?: string; error?: string };
        modulePermissions?: ModulePermissionsMap;
    };
    const canUpdate = Boolean(modulePermissions?.it_asset_requests?.can_update);

    const { t } = useI18n();

    const pageTitle = t('dashboard.itAssetRequests', 'IT Asset Requests');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: pageTitle,
            href: index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />

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
                                <HardDrive className="size-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                                    {pageTitle}
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    {t(
                                        'itAssetRequestsIndex.subtitle',
                                        'View and manage IT asset requests',
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <DataTableToolbar
                                searchUrl={index().url}
                                searchPlaceholder={t(
                                    'itAssetRequestsIndex.searchPlaceholder',
                                    'Search by employee...',
                                )}
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href={create().url}>
                                <Button size="sm" className="gap-2">
                                    <Plus className="size-4" />
                                    {t('itAssetRequestsIndex.newRequest', 'New Request')}
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
                                                {t('itAssetRequestsIndex.table.code', 'Code')}
                                            </th>
                                            <th className="px-4 py-3.5 text-start font-medium">
                                                {t('itAssetRequestsIndex.table.date', 'Date')}
                                            </th>
                                            <th className="px-4 py-3.5 text-start font-medium">
                                                {t('itAssetRequestsIndex.table.employee', 'Employee')}
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-start font-medium md:table-cell">
                                                {t('itAssetRequestsIndex.table.department', 'Department')}
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-start font-medium lg:table-cell">
                                                {t('itAssetRequestsIndex.table.company', 'Company')}
                                            </th>
                                            <th className="px-4 py-3.5 text-start font-medium">
                                                {t('itAssetRequestsIndex.table.status', 'Status')}
                                            </th>
                                            <th className="w-36 px-4 py-3.5 text-end font-medium">
                                                {t('itAssetRequestsIndex.table.actions', 'Actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requestList.length === 0 ? (
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
                                                                ? t(
                                                                      'itAssetRequestsIndex.empty.search',
                                                                      'No IT asset requests match your search.',
                                                                  )
                                                                : t(
                                                                      'itAssetRequestsIndex.empty.noData',
                                                                      'No IT asset requests yet. Create your first request to get started.',
                                                                  )}
                                                        </p>
                                                        {!filters.search && (
                                                            <Link href={create().url}>
                                                                <Button size="sm" variant="outline" className="gap-2">
                                                                    <Plus className="size-4" />
                                                                    {t(
                                                                        'itAssetRequestsIndex.newItAssetRequest',
                                                                        'New IT Asset Request',
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
                                                        <span className="inline-flex rounded-md border border-border/70 bg-muted/30 px-2 py-1 font-mono text-[12px] font-semibold tracking-wide text-foreground sm:text-[13px]">
                                                            {request.code || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {formatDateDdMmYyyy(request.date)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {request.employee
                                                            ? `${request.employee.first_name} ${request.employee.last_name}`
                                                            : '—'}
                                                    </td>
                                                    <td className="hidden px-4 py-3 md:table-cell">
                                                        {request.department?.name ??
                                                            '—'}
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
                                                                href={ItAssetRequestController.show.url(request.id)}
                                                                aria-label={t(
                                                                    'itAssetRequestsIndex.aria.view',
                                                                    'View',
                                                                )}
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
                                                                href={`/it-asset-requests/${request.id}/print`}
                                                                aria-label={t(
                                                                    'itAssetRequestsIndex.aria.print',
                                                                    'Print',
                                                                )}
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
                                                                    href={ItAssetRequestController.edit.url(request.id)}
                                                                    aria-label={t(
                                                                        'itAssetRequestsIndex.aria.edit',
                                                                        'Edit',
                                                                    )}
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
                                links={itAssetRequests.links}
                                from={itAssetRequests.from}
                                to={itAssetRequests.to}
                                total={itAssetRequests.total}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
