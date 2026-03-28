import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import WorkTimetableController, {
    create,
    edit,
    index as workTimetablesIndex,
} from '@/actions/App/Http/Controllers/WorkTimetableController';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import InputError from '@/components/input-error';
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
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Work timetables',
        href: workTimetablesIndex().url,
    },
];

type WorkTimetableRow = {
    id: number;
    name: string;
};

type PaginatedWorkTimetables = {
    data: WorkTimetableRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

export default function Index({
    timetables,
    filters = {},
}: {
    timetables: PaginatedWorkTimetables;
    filters?: { search?: string };
}) {
    const { errors } = usePage<{ errors?: { work_timetable?: string } }>().props;
    const { data: rows } = timetables;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Work timetables" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Work timetable master list</CardTitle>
                            <CardDescription>
                                Weekly day templates employees are tagged with
                                for attendance rules
                            </CardDescription>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <DataTableToolbar
                                searchUrl={workTimetablesIndex().url}
                                searchPlaceholder="Search by name…"
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href={create().url}>
                                <Button>
                                    <Plus />
                                    Add work timetable
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <InputError message={errors.work_timetable} />
                        </div>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium">
                                            Name
                                        </th>
                                        <th className="w-24 px-4 py-3 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={2}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                {filters.search
                                                    ? 'No timetables match your search.'
                                                    : 'No work timetables yet. Create one to assign to employees.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    {row.name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={edit({
                                                                work_timetable:
                                                                    row.id,
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
                                                            <DialogTrigger
                                                                asChild
                                                            >
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
                                                                    Delete work
                                                                    timetable?
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Are you sure
                                                                    you want to
                                                                    delete{' '}
                                                                    <strong>
                                                                        {
                                                                            row.name
                                                                        }
                                                                    </strong>
                                                                    ? Only
                                                                    timetables
                                                                    not assigned
                                                                    to any
                                                                    employee
                                                                    can be
                                                                    removed.
                                                                </DialogDescription>
                                                                <DialogFooter>
                                                                    <DialogClose
                                                                        asChild
                                                                    >
                                                                        <Button variant="secondary">
                                                                            Cancel
                                                                        </Button>
                                                                    </DialogClose>
                                                                    <Button
                                                                        variant="destructive"
                                                                        onClick={() =>
                                                                            router.delete(
                                                                                WorkTimetableController.destroy.url(
                                                                                    row.id,
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
                            links={timetables.links}
                            from={timetables.from}
                            to={timetables.to}
                            total={timetables.total}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
