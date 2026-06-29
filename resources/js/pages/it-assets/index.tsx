import { Head, Link, router } from '@inertiajs/react';
import { Eye, HardDrive, Pencil, Plus, Printer } from 'lucide-react';
import { useMemo } from 'react';
import ItAssetController from '@/actions/App/Http/Controllers/ItAssetController';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useI18n } from '@/lib/i18n';
import { create, index } from '@/routes/it-assets';
import type { BreadcrumbItem } from '@/types';

type Employee = { id: number; first_name: string; last_name: string };
type CatalogRef = { id: number; code: string; name: string };

type ItAsset = {
    id: number;
    code: string;
    category: string;
    name: string;
    status: string;
    serial_number: string | null;
    license_key: string | null;
    asset_tag: string | null;
    hardware?: CatalogRef | null;
    software?: CatalogRef | null;
    accessory?: CatalogRef | null;
    current_employee?: Employee | null;
};

type PaginatedAssets = {
    data: ItAsset[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Option = { value: string; label: string };

function statusClass(status: string): string {
    switch (status) {
        case 'available':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
        case 'assigned':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
        case 'in_repair':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200';
        case 'retired':
            return 'bg-muted text-muted-foreground';
        case 'lost':
            return 'bg-destructive/10 text-destructive';
        default:
            return 'bg-muted text-muted-foreground';
    }
}

function catalogLabel(asset: ItAsset): string {
    return asset.hardware?.name ?? asset.software?.name ?? asset.accessory?.name ?? asset.name;
}

function identifier(asset: ItAsset): string {
    return asset.serial_number ?? asset.license_key ?? asset.asset_tag ?? '—';
}

function categoryLabel(category: string, categories: Option[]): string {
    return categories.find((c) => c.value === category)?.label ?? category;
}

export default function Index({
    assets,
    filters = {},
    categories = [],
    statuses = [],
}: {
    assets: PaginatedAssets;
    filters?: { search?: string; category?: string; status?: string };
    categories?: Option[];
    statuses?: Option[];
}) {
    const { t } = useI18n();
    const { data: assetList } = assets;
    const pageTitle = t('sidebar.itAssets', 'IT Asset Management');

    const breadcrumbs: BreadcrumbItem[] = [{ title: pageTitle, href: index().url }];

    const persistQuery = useMemo(() => {
        const query: Record<string, string> = {};
        if (filters.category) {
            query.category = filters.category;
        }
        if (filters.status) {
            query.status = filters.status;
        }

        return query;
    }, [filters.category, filters.status]);

    function navigate(params: Record<string, string | undefined>) {
        const cleaned: Record<string, string> = {};
        if (params.search?.trim()) {
            cleaned.search = params.search.trim();
        }
        if (params.category) {
            cleaned.category = params.category;
        }
        if (params.status) {
            cleaned.status = params.status;
        }
        router.get(index().url, cleaned, { preserveState: true, preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />

            <div className="flex h-full flex-1 flex-col">
                <div className="border-b bg-gradient-to-b from-muted/30 to-background px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                <HardDrive className="size-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{pageTitle}</h1>
                                <p className="text-muted-foreground text-sm">
                                    {t('itAssets.subtitle', 'Create, assign, and track devices, software, and accessories')}
                                </p>
                            </div>
                        </div>
                        <Link href={create().url}>
                            <Button size="sm" className="gap-2">
                                <Plus className="size-4" />
                                {t('itAssets.newAsset', 'New Asset')}
                            </Button>
                        </Link>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <DataTableToolbar
                            searchUrl={index().url}
                            searchPlaceholder={t('itAssets.searchPlaceholder', 'Search by code, label, serial, or item...')}
                            filters={{ search: filters.search }}
                            persistQuery={persistQuery}
                            autoSearch
                            showSearchButton={false}
                        />
                        <div className="flex flex-wrap gap-2">
                            <Select
                                value={filters.category ?? 'all'}
                                onValueChange={(v) =>
                                    navigate({
                                        search: filters.search,
                                        category: v === 'all' ? undefined : v,
                                        status: filters.status,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All categories</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.status ?? 'all'}
                                onValueChange={(v) =>
                                    navigate({
                                        search: filters.search,
                                        category: filters.category,
                                        status: v === 'all' ? undefined : v,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    {statuses.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                            <th className="px-4 py-3.5 text-start font-medium">Code</th>
                                            <th className="px-4 py-3.5 text-start font-medium">Category</th>
                                            <th className="px-4 py-3.5 text-start font-medium">Item</th>
                                            <th className="px-4 py-3.5 text-start font-medium">Identifier</th>
                                            <th className="px-4 py-3.5 text-start font-medium">Status</th>
                                            <th className="hidden px-4 py-3.5 text-start font-medium md:table-cell">Assigned To</th>
                                            <th className="w-32 px-4 py-3.5 text-end font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assetList.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-16 text-center">
                                                    <p className="text-muted-foreground text-sm">
                                                        {filters.search
                                                            ? 'No assets match your search.'
                                                            : 'No assets yet. Create your first asset to get started.'}
                                                    </p>
                                                    {!filters.search && (
                                                        <Link href={create().url} className="mt-3 inline-block">
                                                            <Button size="sm" variant="outline" className="gap-2">
                                                                <Plus className="size-4" />
                                                                New Asset
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            assetList.map((asset) => (
                                                <tr key={asset.id} className="border-b hover:bg-muted/30 last:border-0">
                                                    <td className="px-4 py-3 font-mono text-xs">{asset.code}</td>
                                                    <td className="px-4 py-3">{categoryLabel(asset.category, categories)}</td>
                                                    <td className="px-4 py-3">{catalogLabel(asset)}</td>
                                                    <td className="px-4 py-3 font-mono text-xs">{identifier(asset)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass(asset.status)}`}>
                                                            {asset.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="hidden px-4 py-3 md:table-cell">
                                                        {asset.current_employee
                                                            ? `${asset.current_employee.first_name} ${asset.current_employee.last_name}`
                                                            : '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-end gap-1">
                                                            <Link href={ItAssetController.show.url(asset.id)}>
                                                                <Button variant="ghost" size="icon" className="size-8" title="View">
                                                                    <Eye className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            <Link href={ItAssetController.edit.url(asset.id)}>
                                                                <Button variant="ghost" size="icon" className="size-8" title="Edit">
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            <Link href={ItAssetController.print.url(asset.id)} target="_blank">
                                                                <Button variant="ghost" size="icon" className="size-8" title="Print label">
                                                                    <Printer className="size-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <DataTablePagination links={assets.links} from={assets.from} to={assets.to} total={assets.total} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
