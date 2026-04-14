import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import LeaveTypeController from '@/actions/App/Http/Controllers/LeaveTypeController';
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
import { create, edit, index } from '@/routes/leave-types';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Leave Types',
        href: index().url,
    },
];

type LeaveType = {
    id: number;
    code: string;
    name: string;
    leave_category: 'paid' | 'unpaid';
    description: string | null;
};

type PaginatedLeaveTypes = {
    data: LeaveType[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

export default function Index({
    leaveTypes,
    filters = {},
}: {
    leaveTypes: PaginatedLeaveTypes;
    filters?: { search?: string };
}) {
    const { data: leaveTypeList } = leaveTypes;
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Types" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Leave Type Master List</CardTitle>
                            <CardDescription>
                                Manage leave type codes, names, and descriptions
                            </CardDescription>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <DataTableToolbar
                                searchUrl={index().url}
                                searchPlaceholder="Search code, name, category, description..."
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href={create().url}>
                                <Button>
                                    <Plus />
                                    Add Leave Type
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
                                            Code
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Category
                                        </th>
                                        <th className="w-24 px-4 py-3 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaveTypeList.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                {filters.search
                                                    ? 'No leave types match your search.'
                                                    : 'No leave types found. Create one to get started.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        leaveTypeList.map((leaveType) => (
                                            <tr
                                                key={leaveType.id}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <td className="px-4 py-3 font-mono">
                                                    {leaveType.code}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {leaveType.name}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {leaveType.description ??
                                                        '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium">
                                                        {leaveType.leave_category === 'paid'
                                                            ? 'Paid Leave'
                                                            : 'Unpaid Leave'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={edit({
                                                                leave_type:
                                                                    leaveType.id,
                                                            }).url}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label="Edit"
                                                            >
                                                                <Pencil />
                                                            </Button>
                                                        </Link>
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
                                                                    Delete leave
                                                                    type?
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Are you sure
                                                                    you want to
                                                                    delete{' '}
                                                                    <strong>
                                                                        {
                                                                            leaveType.name
                                                                        }
                                                                    </strong>{' '}
                                                                    ({leaveType.code}
                                                                    )? This
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
                                                                                LeaveTypeController.destroy.url(
                                                                                    leaveType.id
                                                                                )
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
                            links={leaveTypes.links}
                            from={leaveTypes.from}
                            to={leaveTypes.to}
                            total={leaveTypes.total}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
