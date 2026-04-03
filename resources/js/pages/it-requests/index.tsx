import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    FileText,
    Monitor,
    Pencil,
    Plus,
    Printer,
    Trash2,
} from 'lucide-react';
import ItRequestController from '@/actions/App/Http/Controllers/ItRequestController';
import { DataTablePagination } from '@/components/data-table-pagination';
import { RequestStatusBadge } from '@/components/request-status-badge';
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
import { create, index } from '@/routes/it-requests';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'IT Requests',
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="IT Requests" />

            <div className="flex h-full flex-1 flex-col">
                {/* Page header */}
                <div className="border-b bg-gradient-to-b from-muted/30 to-background px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                <Monitor className="size-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                                    IT Requests
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    View and manage submitted IT requests
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
                                                Employee
                                            </th>
                                            <th className="px-4 py-3.5 text-left font-medium">
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
                                                    colSpan={4}
                                                    className="px-4 py-16 text-center"
                                                >
                                                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                                                        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                                                            <FileText className="size-7 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-muted-foreground text-sm">
                                                            {filters.search
                                                                ? 'No IT requests match your search.'
                                                                : 'No IT requests yet. Create your first request to get started.'}
                                                        </p>
                                                        {!filters.search && (
                                                            <Link href={create().url}>
                                                                <Button size="sm" variant="outline" className="gap-2">
                                                                    <Plus className="size-4" />
                                                                    New IT Request
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
                                                                href={`${ItRequestController.show.url(request.id)}?print=1`}
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
                                                                    href={ItRequestController.edit.url(request.id)}
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
                                                                        Delete IT request?
                                                                    </DialogTitle>
                                                                    <DialogDescription>
                                                                        Are you sure you want to delete this IT request
                                                                        for{' '}
                                                                        <strong>
                                                                            {request.employee
                                                                                ? `${request.employee.first_name} ${request.employee.last_name}`
                                                                                : 'this employee'}
                                                                        </strong>
                                                                        ? This action cannot be undone.
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
                                                                                    ItRequestController.destroy.url(
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
