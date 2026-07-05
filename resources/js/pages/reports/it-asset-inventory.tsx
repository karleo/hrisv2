import { Head, router } from '@inertiajs/react';
import { Download, FileText } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { formatDisplayDate } from '@/lib/format-display-date';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/it-asset-inventory' },
    { title: 'IT asset inventory', href: '/reports/it-asset-inventory' },
];

type ReportFilters = {
    from?: string;
    to?: string;
    category?: string;
    hardware_id?: string;
    employee_id?: string;
};

type ReportRow = {
    code: string;
    category: string;
    label: string;
    device_type: string;
    identifier: string;
    status: string;
    employee_name: string;
    employee_code: string | null;
    purchase_date: string | null;
    asset_value: number | null;
    asset_currency: string | null;
    registered_at: string | null;
};

function filtersToParams(filters: ReportFilters, extra?: Record<string, string>): Record<string, string> {
    const params: Record<string, string> = { ...extra };

    if (filters.from) {
        params.from = filters.from;
    }
    if (filters.to) {
        params.to = filters.to;
    }
    if (filters.category) {
        params.category = filters.category;
    }
    if (filters.hardware_id) {
        params.hardware_id = filters.hardware_id;
    }
    if (filters.employee_id) {
        params.employee_id = filters.employee_id;
    }

    return params;
}

function formatValue(value: number | null, currency: string | null): string {
    if (value === null) {
        return '—';
    }

    const formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return currency ? `${formatted} ${currency}` : formatted;
}

export default function ItAssetInventoryReport({
    rows,
    filters,
    summary,
    employees,
    hardwareTypes,
    categories,
    canChooseEmployee = true,
}: {
    rows: {
        data: ReportRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        last_page: number;
        current_page: number;
    };
    filters: ReportFilters;
    summary: { total_assets: number; total_value: number };
    employees: Array<{
        id: number;
        name: string;
        employee_code: string;
    }>;
    hardwareTypes: Array<{ id: number; name: string; code: string }>;
    categories: Array<{ value: string; label: string }>;
    canChooseEmployee?: boolean;
}) {
    const [localFilters, setLocalFilters] = useState<ReportFilters>(filters);
    const selectedEmployee = employees.find(
        (employee) => String(employee.id) === (localFilters.employee_id ?? ''),
    );

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const loadReport = useCallback((next: ReportFilters) => {
        router.get('/reports/it-asset-inventory', filtersToParams(next), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['rows', 'filters', 'summary'],
        });
    }, []);

    const updateFilters = (patch: Partial<ReportFilters>) => {
        const next = { ...localFilters, ...patch };
        setLocalFilters(next);
        loadReport(next);
    };

    const exportQuery = (format: 'csv' | 'pdf') =>
        new URLSearchParams({
            ...filtersToParams(localFilters),
            export: format,
        }).toString();

    const excelExportHref = `/reports/it-asset-inventory?${exportQuery('csv')}`;
    const pdfExportHref = `/reports/it-asset-inventory?${exportQuery('pdf')}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="IT asset inventory report" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="IT asset inventory"
                    description="Export the current IT asset inventory with filters by date, category, device type, and assigned employee."
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filters</CardTitle>
                        <p className="text-muted-foreground text-sm">
                            Date range matches purchase date, or registration date when purchase date is not set.
                            Leave dates empty to include all assets.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                            <div>
                                <Label htmlFor="report-from">From</Label>
                                <Input
                                    id="report-from"
                                    type="date"
                                    value={localFilters.from ?? ''}
                                    onChange={(e) =>
                                        updateFilters({ from: e.target.value || undefined })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="report-to">To</Label>
                                <Input
                                    id="report-to"
                                    type="date"
                                    value={localFilters.to ?? ''}
                                    onChange={(e) =>
                                        updateFilters({ to: e.target.value || undefined })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="report-category">Category</Label>
                                <NativeSelect
                                    id="report-category"
                                    value={localFilters.category ?? ''}
                                    onChange={(e) =>
                                        updateFilters({
                                            category: e.target.value || undefined,
                                        })
                                    }
                                >
                                    <option value="">All</option>
                                    {categories.map((category) => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div>
                                <Label htmlFor="report-hardware">Device type</Label>
                                <NativeSelect
                                    id="report-hardware"
                                    value={localFilters.hardware_id ?? ''}
                                    onChange={(e) =>
                                        updateFilters({
                                            hardware_id: e.target.value || undefined,
                                        })
                                    }
                                >
                                    <option value="">All</option>
                                    {hardwareTypes.map((hardware) => (
                                        <option key={hardware.id} value={hardware.id}>
                                            {hardware.name}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div>
                                <Label htmlFor="report-employee">Employee</Label>
                                {canChooseEmployee ? (
                                    <NativeSelect
                                        id="report-employee"
                                        value={localFilters.employee_id ?? ''}
                                        onChange={(e) =>
                                            updateFilters({
                                                employee_id: e.target.value || undefined,
                                            })
                                        }
                                    >
                                        <option value="">All</option>
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.name}
                                                {employee.employee_code
                                                    ? ` (${employee.employee_code})`
                                                    : ''}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                ) : (
                                    <Input
                                        id="report-employee"
                                        readOnly
                                        value={selectedEmployee?.name ?? '—'}
                                        className="bg-muted/40"
                                    />
                                )}
                            </div>
                            <div className="flex flex-wrap items-end gap-2 md:col-span-3 lg:col-span-5">
                                <Button type="button" variant="outline" asChild>
                                    <a href={excelExportHref}>
                                        <Download className="mr-2 size-4" />
                                        Export Excel
                                    </a>
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <a href={pdfExportHref}>
                                        <FileText className="mr-2 size-4" />
                                        Download PDF
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Results</CardTitle>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {summary.total_assets} asset(s)
                                {summary.total_value > 0
                                    ? ` · Total value ${summary.total_value.toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                      })}`
                                    : ''}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {rows.data.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No assets match the selected filters. Adjust filters above or register assets in IT
                                Asset Management.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="py-2 pr-4">Code</th>
                                            <th className="py-2 pr-4">Category</th>
                                            <th className="py-2 pr-4">Label</th>
                                            <th className="py-2 pr-4">Device type</th>
                                            <th className="py-2 pr-4">Serial / license</th>
                                            <th className="py-2 pr-4">Status</th>
                                            <th className="py-2 pr-4">Employee</th>
                                            <th className="py-2 pr-4">Purchase</th>
                                            <th className="py-2 pr-4">Value</th>
                                            <th className="py-2 pr-4">Registered</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.data.map((row) => (
                                            <tr key={row.code} className="border-b">
                                                <td className="py-2 pr-4 font-medium">{row.code}</td>
                                                <td className="py-2 pr-4">{row.category}</td>
                                                <td className="py-2 pr-4">{row.label}</td>
                                                <td className="py-2 pr-4">{row.device_type}</td>
                                                <td className="py-2 pr-4">{row.identifier}</td>
                                                <td className="py-2 pr-4">{row.status}</td>
                                                <td className="py-2 pr-4">{row.employee_name}</td>
                                                <td className="py-2 pr-4">
                                                    {row.purchase_date
                                                        ? formatDisplayDate(row.purchase_date)
                                                        : '—'}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {formatValue(row.asset_value, row.asset_currency)}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {row.registered_at
                                                        ? formatDisplayDate(row.registered_at)
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
