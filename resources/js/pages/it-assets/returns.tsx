import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, HardDrive } from 'lucide-react';
import ItAssetController from '@/actions/App/Http/Controllers/ItAssetController';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/it-assets';
import type { BreadcrumbItem } from '@/types';

type Employee = { id: number; first_name: string; last_name: string };
type CatalogRef = { code: string; name: string };

type Assignment = {
    id: number;
    assigned_at: string;
    returned_at: string;
    condition_on_return: string | null;
    return_notes: string | null;
    employee?: Employee;
    it_asset?: {
        id: number;
        code: string;
        category: string;
        name: string;
        hardware?: CatalogRef | null;
        software?: CatalogRef | null;
        accessory?: CatalogRef | null;
    };
};

type PaginatedAssignments = {
    data: Assignment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'IT Assets', href: '/it-assets' },
    { title: 'Returns', href: '/it-assets/returns' },
];

function itemName(assignment: Assignment): string {
    const asset = assignment.it_asset;
    if (!asset) return '—';
    return asset.hardware?.name ?? asset.software?.name ?? asset.accessory?.name ?? asset.name;
}

export default function Returns({
    assignments,
    filters = {},
}: {
    assignments: PaginatedAssignments;
    filters?: { search?: string };
}) {
    const { data: rows } = assignments;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asset Returns" />

            <div className="flex h-full flex-1 flex-col">
                <div className="border-b bg-gradient-to-b from-muted/30 to-background px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                <HardDrive className="size-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Returns history</h1>
                                <p className="text-muted-foreground text-sm">Completed asset returns</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <DataTableToolbar
                                searchUrl="/it-assets/returns"
                                searchPlaceholder="Search assets..."
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href={index().url} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                                <ArrowLeft className="size-4" />
                                Inventory
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto p-4 sm:p-6 lg:p-8">
                    <Card className="border shadow-sm">
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="px-4 py-3 text-start font-medium">Asset</th>
                                        <th className="px-4 py-3 text-start font-medium">Category</th>
                                        <th className="px-4 py-3 text-start font-medium">Employee</th>
                                        <th className="px-4 py-3 text-start font-medium">Assigned</th>
                                        <th className="px-4 py-3 text-start font-medium">Returned</th>
                                        <th className="px-4 py-3 text-start font-medium">Condition</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                                No returns recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr key={row.id} className="border-b hover:bg-muted/30 last:border-0">
                                                <td className="px-4 py-3">
                                                    {row.it_asset ? (
                                                        <Link href={ItAssetController.show.url(row.it_asset.id)} className="font-mono text-xs hover:underline">
                                                            {row.it_asset.code}
                                                        </Link>
                                                    ) : '—'}
                                                    <div className="text-muted-foreground">{itemName(row)}</div>
                                                </td>
                                                <td className="px-4 py-3 capitalize">{row.it_asset?.category ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    {row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : '—'}
                                                </td>
                                                <td className="px-4 py-3">{new Date(row.assigned_at).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">{new Date(row.returned_at).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">{row.condition_on_return ?? '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <DataTablePagination links={assignments.links} from={assignments.from} to={assignments.to} total={assignments.total} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
