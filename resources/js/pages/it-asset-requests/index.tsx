import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    FileText,
    HardDrive,
    Pencil,
    Plus,
    Printer,
    Trash2,
} from 'lucide-react';
import ItAssetRequestController from '@/actions/App/Http/Controllers/ItAssetRequestController';
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
import { create, index } from '@/routes/it-asset-requests';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'IT Asset Requests',
        href: index().url,
    },
];

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
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

function StatusBadge({ status }: { status: string }) {
    const isDraft = status === 'draft';
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isDraft
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary/10 text-primary'
            }`}
        >
            {isDraft ? 'Draft' : 'Submitted'}
        </span>
    );
}

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="IT Asset Requests" />

            <div className="flex h-full flex-1 flex-col">
                {/* Page header */}
                <div className="border-b bg-gradient-to-b from-muted/30 to-background px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                <HardDrive className="size-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                                    IT Asset Requests
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    View and manage IT asset requests
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <DataTableToolbar
                                searchUrl={index().url}
                                searchPlaceholder="Search by employee..."
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href={create().url}>
                                <Button size="sm" className="gap-2">
                                    <Plus className="size-4" />
                                    New Request
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
                                                Date
                                            </th>
                                            <th className="px-4 py-3.5 text-left font-medium">
                                                Employee
                                            </th>
                                            <th className="hidden px-4 py-3.5 text-left font-medium md:table-cell">
                                                Department
                                            </th>
                                            <th className="px-4 py-3.5 text-left font-medium">
                                                Status
                                            </th>
                                            <th className="w-36 px-4 py-3.5 text-right font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requestList.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-4 py-16 text-center"
                                                >
                                                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                                                        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                                                            <FileText className="size-7 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-muted-foreground text-sm">
                                                            {filters.search
                                                                ? 'No IT asset requests match your search.'
                                                                : 'No IT asset requests yet. Create your first request to get started.'}
                                                        </p>
                                                        {!filters.search && (
                                                            <Link href={create().url}>
                                                                <Button size="sm" variant="outline" className="gap-2">
                                                                    <Plus className="size-4" />
                                                                    New IT Asset Request
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
                                                    <td className="px-4 py-3 font-medium">
                                                        {request.code || '—'}
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
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={request.status} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-end gap-1">
                                                            <Link
                                                                href={ItAssetRequestController.show.url(request.id)}
                                                                aria-label="View"
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
                                                                href={`${ItAssetRequestController.show.url(request.id)}?print=1`}
                                                                aria-label="Print"
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-8"
                                                                >
                                                                    <Printer className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            {request.status === 'draft' && (
                                                                <Link
                                                                    href={ItAssetRequestController.edit.url(request.id)}
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
                                                            )}
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
                                                                        Delete IT asset request?
                                                                    </DialogTitle>
                                                                    <DialogDescription>
                                                                        Are you sure you want to delete this request?
                                                                        This action cannot be undone.
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
                                                                                    ItAssetRequestController.destroy.url(
                                                                                        request.id,
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
