import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import type { BreadcrumbItem } from '@/types';

type Hardware = {
    id: number;
    code: string;
    name: string;
};

type AssetValue = {
    id: number;
    asset_model: string | null;
    asset_value: string | null;
    asset_currency: string | null;
    purchase_date: string | null;
    vendor: string | null;
    serial_number: string | null;
    specs: string | null;
    effective_from: string | null;
    effective_to: string | null;
    is_active: boolean;
    hardware: Hardware | null;
};

type PaginatedAssetValues = {
    data: AssetValue[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Asset Values', href: '/hardware-asset-values' },
];

function formatMoney(value: string | null, currency: string | null): string {
    if (!value || !currency) {
        return '—';
    }

    return `${currency} ${Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return value;
    }

    const [, yyyy, mm, dd] = match;

    return `${dd}/${mm}/${yyyy}`;
}

export default function Index({
    assetValues,
    filters = {},
}: {
    assetValues: PaginatedAssetValues;
    filters?: { search?: string };
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asset Values" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Asset Value Master</CardTitle>
                            <CardDescription>
                                Manage hardware valuation, serials, vendors, and specifications
                            </CardDescription>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <DataTableToolbar
                                searchUrl="/hardware-asset-values"
                                searchPlaceholder="Search hardware, serial, vendor, model..."
                                filters={filters}
                                autoSearch
                                showSearchButton={false}
                            />
                            <Link href="/hardware-asset-values/create">
                                <Button>
                                    <Plus />
                                    Add Asset Value
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
                                            Hardware
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Asset Details
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Value
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Effective From
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Effective To
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Status
                                        </th>
                                        <th className="w-24 px-4 py-3 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assetValues.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                No asset values found.
                                            </td>
                                        </tr>
                                    ) : (
                                        assetValues.data.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">
                                                        {item.hardware?.code ?? '—'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.hardware?.name ?? 'Hardware unavailable'}
                                                    </div>
                                                </td>
                                                <td className="max-w-[260px] px-4 py-3 text-xs text-muted-foreground">
                                                    <div className="space-y-1">
                                                        <div>
                                                            <span className="font-medium text-foreground">Model:</span>{' '}
                                                            {item.asset_model ?? '—'}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-foreground">Serial:</span>{' '}
                                                            <span title={item.serial_number ?? undefined}>
                                                                {item.serial_number ?? '—'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-foreground">Vendor:</span>{' '}
                                                            {item.vendor ?? '—'}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-foreground">Purchased:</span>{' '}
                                                            {formatDate(item.purchase_date)}
                                                        </div>
                                                        {item.specs ? (
                                                            <div className="truncate" title={item.specs}>
                                                                <span className="font-medium text-foreground">Specs:</span>{' '}
                                                                {item.specs}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {formatMoney(item.asset_value, item.asset_currency)}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {formatDate(item.effective_from)}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {formatDate(item.effective_to)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={item.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/hardware-asset-values/${item.id}/edit`}>
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
                                                                    Delete asset value?
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    This will remove the master value only. Existing IT asset request snapshots will remain unchanged.
                                                                </DialogDescription>
                                                                <DialogFooter>
                                                                    <DialogClose asChild>
                                                                        <Button type="button" variant="secondary">
                                                                            Cancel
                                                                        </Button>
                                                                    </DialogClose>
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        onClick={() => router.delete(`/hardware-asset-values/${item.id}`)}
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
                            links={assetValues.links}
                            from={assetValues.from}
                            to={assetValues.to}
                            total={assetValues.total}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
