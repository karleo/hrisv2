import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PayDeductionTypeController from '@/actions/App/Http/Controllers/Payroll/PayDeductionTypeController';
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
    { title: 'Deduction Types', href: '/payroll/deduction-types' },
];

type BehaviorOption = { value: string; label: string };

type DeductionType = {
    id: number;
    code: string;
    name: string;
    behavior: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
};

type PaginatedDeductionTypes = {
    data: DeductionType[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

function behaviorLabel(behavior: string, options: BehaviorOption[]): string {
    return options.find((o) => o.value === behavior)?.label ?? behavior;
}

export default function Index({
    deductionTypes,
    behaviorOptions,
    filters = {},
}: {
    deductionTypes: PaginatedDeductionTypes;
    behaviorOptions: BehaviorOption[];
    filters?: { search?: string };
}) {
    const { data: list } = deductionTypes;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Deduction Types" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Deduction Type Master List</CardTitle>
                            <CardDescription>Manage deduction types including loan and cash advance behaviors</CardDescription>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <DataTableToolbar
                                searchUrl="/payroll/deduction-types"
                                searchPlaceholder="Search code, name, behavior..."
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href="/payroll/deduction-types/create">
                                <Button>
                                    <Plus />
                                    Add Deduction Type
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
                                        <th className="px-4 py-3 text-left font-medium">Behavior</th>
                                        <th className="px-4 py-3 text-left font-medium">Description</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="w-24 px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                {filters.search ? 'No deduction types match your search.' : 'No deduction types yet.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item) => (
                                            <tr key={item.id} className="border-b last:border-0">
                                                <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                                                <td className="px-4 py-3 font-medium">{item.name}</td>
                                                <td className="px-4 py-3">{behaviorLabel(item.behavior, behaviorOptions)}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.description ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={item.is_active ? 'text-emerald-600' : 'text-muted-foreground'}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <Link href={`/payroll/deduction-types/${item.id}/edit`}>
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
                                                                <DialogTitle>Delete deduction type</DialogTitle>
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
                                                                                PayDeductionTypeController.destroy.url(item.id),
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
                        <DataTablePagination paginator={deductionTypes} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
