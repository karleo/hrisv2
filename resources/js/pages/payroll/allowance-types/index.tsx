import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PayAllowanceTypeController from '@/actions/App/Http/Controllers/Payroll/PayAllowanceTypeController';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    { title: 'Allowance Types', href: '/payroll/allowance-types' },
];

type AllowanceType = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
};

type PaginatedAllowanceTypes = {
    data: AllowanceType[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

export default function Index({
    allowanceTypes,
    filters = {},
}: {
    allowanceTypes: PaginatedAllowanceTypes;
    filters?: { search?: string };
}) {
    const { data: list } = allowanceTypes;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Allowance Types" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Allowance Type Master List</CardTitle>
                            <CardDescription>Manage allowance types used in employee compensation</CardDescription>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <DataTableToolbar
                                searchUrl="/payroll/allowance-types"
                                searchPlaceholder="Search code, name, description..."
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href="/payroll/allowance-types/create">
                                <Button>
                                    <Plus />
                                    Add Allowance Type
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium">Code</th>
                                        <th className="px-4 py-3 text-left font-medium">Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Description</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="w-24 px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                {filters.search ? 'No allowance types match your search.' : 'No allowance types yet.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item) => (
                                            <tr key={item.id} className="border-b last:border-0">
                                                <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                                                <td className="px-4 py-3 font-medium">{item.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.description ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={item.is_active ? 'text-emerald-600' : 'text-muted-foreground'}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <Link href={`/payroll/allowance-types/${item.id}/edit`}>
                                                            <Button variant="ghost" size="icon" aria-label="Edit">
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                        </Link>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-destructive" aria-label="Delete">
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogTitle>Delete allowance type</DialogTitle>
                                                                <DialogDescription>
                                                                    Are you sure you want to delete &quot;{item.name}&quot;? This cannot be undone.
                                                                </DialogDescription>
                                                                <DialogFooter>
                                                                    <DialogClose asChild>
                                                                        <Button variant="outline">Cancel</Button>
                                                                    </DialogClose>
                                                                    <Button
                                                                        variant="destructive"
                                                                        onClick={() =>
                                                                            router.delete(
                                                                                PayAllowanceTypeController.destroy.url(item.id),
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
                        <DataTablePagination paginator={allowanceTypes} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
