import { Head, Link, router } from '@inertiajs/react';
import { Eye, Plus, Printer, Trash2 } from 'lucide-react';
import ItRequestController from '@/actions/App/Http/Controllers/ItRequestController';
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

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>IT Request List</CardTitle>
                            <CardDescription>
                                View and manage submitted IT requests
                            </CardDescription>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <DataTableToolbar
                                searchUrl={index().url}
                                searchPlaceholder="Search by employee name..."
                                filters={filters}
                            />
                            <Link href={create().url}>
                                <Button>
                                    <Plus />
                                    New IT Request
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
                                            Employee
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Department
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Status
                                        </th>
                                        <th className="w-40 px-4 py-3 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requestList.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                {filters.search
                                                    ? 'No IT requests match your search.'
                                                    : 'No IT requests found. Create one to get started.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        requestList.map((request) => (
                                            <tr
                                                key={request.id}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <td className="px-4 py-3">
                                                    {request.employee
                                                        ? `${request.employee.first_name} ${request.employee.last_name}`
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {request.department?.name ??
                                                        '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium"
                                                        data-status={
                                                            request.status
                                                        }
                                                    >
                                                        {request.status ===
                                                        'draft'
                                                            ? 'Draft'
                                                            : 'Submitted'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={ItRequestController.show.url(
                                                                request.id,
                                                            )}
                                                            aria-label="View"
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                type="button"
                                                            >
                                                                <Eye className="size-4" />
                                                            </Button>
                                                        </Link>
                                                        <Link
                                                            href={`${ItRequestController.show.url(
                                                                request.id,
                                                            )}?print=1`}
                                                            aria-label="Print"
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                type="button"
                                                            >
                                                                <Printer className="size-4" />
                                                            </Button>
                                                        </Link>

                                                        {request.status ===
                                                            'draft' && (
                                                            <Link
                                                                href={ItRequestController.edit.url(
                                                                    request.id,
                                                                )}
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label="Edit"
                                                                >
                                                                    ✏️
                                                                </Button>
                                                            </Link>
                                                        )}

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
                                                                    Delete IT
                                                                    request?
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Are you sure
                                                                    you want to
                                                                    delete this
                                                                    IT request
                                                                    for{' '}
                                                                    <strong>
                                                                        {request.employee
                                                                            ? `${request.employee.first_name} ${request.employee.last_name}`
                                                                            : 'this employee'}
                                                                    </strong>
                                                                    ? This
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
        </AppLayout>
    );
}

