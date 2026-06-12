import { Head, Link, router } from '@inertiajs/react';
import { Download, FileText } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import {
    AttendanceEvidenceCell,
    AttendanceRemarksCell,
    type AttendanceRemarksEvidence,
} from '@/components/attendance-entry-cells';
import { formatDisplayDate } from '@/lib/format-display-date';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/attendance' },
    { title: 'Attendance report', href: '/reports/attendance' },
];

type ReportFilters = {
    from: string;
    to: string;
    employee_id?: string;
    biometric_device_id?: string;
};

type ReportRow = AttendanceRemarksEvidence & {
    date: string;
    employee_id: number | null;
    employee_name: string;
    employee_code: string | null;
    device_pin: string;
    device_name: string | null;
    clock_in: string | null;
    clock_out: string | null;
    working_hours: string;
    overtime: string;
    punch_count: number;
    source?: 'biometric' | 'manual' | 'merged';
    work_mode_label?: string | null;
};

function sourceLabel(source: ReportRow['source']): string {
    switch (source) {
        case 'manual':
            return 'Web check-in';
        case 'merged':
            return 'Merged';
        default:
            return 'Biometric';
    }
}

function filtersToParams(filters: ReportFilters, extra?: Record<string, string>): Record<string, string> {
    const params: Record<string, string> = { ...extra };

    if (filters.from) {
        params.from = filters.from;
    }
    if (filters.to) {
        params.to = filters.to;
    }
    if (filters.employee_id) {
        params.employee_id = filters.employee_id;
    }
    if (filters.biometric_device_id) {
        params.biometric_device_id = filters.biometric_device_id;
    }

    return params;
}

export default function AttendanceReport({
    rows,
    filters,
    summary,
    employees,
    devices,
    canChooseEmployee = true,
}: {
    rows: {
        data: ReportRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        last_page: number;
        current_page: number;
    };
    filters: ReportFilters;
    summary: { total_days: number; total_punches: number; total_manual_entries?: number };
    employees: Array<{
        id: number;
        name: string;
        employee_code: string;
        biometric_user_id: string | null;
    }>;
    devices: Array<{ id: number; name: string }>;
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
        if (!next.from || !next.to) {
            return;
        }

        router.get('/reports/attendance', filtersToParams(next), {
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

    const csvExportHref = `/reports/attendance?${exportQuery('csv')}`;
    const pdfExportHref = `/reports/attendance?${exportQuery('pdf')}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance report" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Attendance report"
                    description="Daily clock-in and clock-out from biometric punches and web check-ins, merged per employee and day."
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filters</CardTitle>
                        <p className="text-muted-foreground text-sm">
                            The report updates automatically when you change dates, employee, or device.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <Label htmlFor="report-from">From</Label>
                                <Input
                                    id="report-from"
                                    type="date"
                                    value={localFilters.from}
                                    required
                                    onChange={(e) => updateFilters({ from: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="report-to">To</Label>
                                <Input
                                    id="report-to"
                                    type="date"
                                    value={localFilters.to}
                                    required
                                    onChange={(e) => updateFilters({ to: e.target.value })}
                                />
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
                                                {employee.biometric_user_id
                                                    ? ` (PIN ${employee.biometric_user_id})`
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
                            <div>
                                <Label htmlFor="report-device">Device</Label>
                                <NativeSelect
                                    id="report-device"
                                    value={localFilters.biometric_device_id ?? ''}
                                    onChange={(e) =>
                                        updateFilters({
                                            biometric_device_id: e.target.value || undefined,
                                        })
                                    }
                                >
                                    <option value="">All</option>
                                    {devices.map((device) => (
                                        <option key={device.id} value={device.id}>
                                            {device.name}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div className="flex flex-wrap items-end gap-2 md:col-span-4">
                                <Button type="button" variant="outline" asChild>
                                    <a href={csvExportHref}>
                                        <Download className="mr-2 size-4" />
                                        Export CSV
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
                                {summary.total_days} day row(s) · {summary.total_punches} biometric punch(es)
                                {(summary.total_manual_entries ?? 0) > 0
                                    ? ` · ${summary.total_manual_entries} web check-in(s)`
                                    : ''}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {rows.data.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No attendance for this range. Employees can use web check-in, or import biometric
                                punches from Biometric attendance, then adjust filters above.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="py-2 pr-4">Date</th>
                                            <th className="py-2 pr-4">Employee</th>
                                            <th className="py-2 pr-4">Code</th>
                                            <th className="py-2 pr-4">Device PIN</th>
                                            <th className="py-2 pr-4">Device</th>
                                            <th className="py-2 pr-4">Source</th>
                                            <th className="py-2 pr-4">Work mode</th>
                                            <th className="py-2 pr-4">Clock in</th>
                                            <th className="py-2 pr-4">Clock out</th>
                                            <th className="py-2 pr-4">Working hours</th>
                                            <th className="py-2 pr-4">Overtime</th>
                                            <th className="py-2 pr-4">Punches</th>
                                            <th className="py-2 pr-4">Remarks</th>
                                            <th className="py-2">Evidence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.data.map((row, index) => (
                                            <tr
                                                key={`${row.date}-${row.device_pin}-${row.employee_id ?? 'u'}-${index}`}
                                                className="border-b"
                                            >
                                                <td className="py-2 pr-4">{formatDisplayDate(row.date)}</td>
                                                <td className="py-2 pr-4">{row.employee_name}</td>
                                                <td className="py-2 pr-4 font-mono text-xs">
                                                    {row.employee_code ?? '—'}
                                                </td>
                                                <td className="py-2 pr-4 font-mono text-xs">{row.device_pin}</td>
                                                <td className="py-2 pr-4">{row.device_name ?? '—'}</td>
                                                <td className="py-2 pr-4">{sourceLabel(row.source)}</td>
                                                <td className="py-2 pr-4">{row.work_mode_label ?? '—'}</td>
                                                <td className="py-2 pr-4 font-mono text-xs">{row.clock_in ?? '—'}</td>
                                                <td className="py-2 pr-4 font-mono text-xs">{row.clock_out ?? '—'}</td>
                                                <td className="py-2 pr-4">{row.working_hours}</td>
                                                <td className="py-2 pr-4">{row.overtime}</td>
                                                <td className="py-2 pr-4">{row.punch_count}</td>
                                                <td className="py-2 pr-4">
                                                    <AttendanceRemarksCell row={row} />
                                                </td>
                                                <td className="py-2">
                                                    <AttendanceEvidenceCell row={row} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {rows.last_page > 1 && (
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                    Page {rows.current_page} of {rows.last_page}
                                </span>
                                {rows.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            preserveScroll
                                            only={['rows', 'filters', 'summary']}
                                            className={
                                                link.active
                                                    ? 'rounded-md bg-primary px-2 py-1 text-primary-foreground'
                                                    : 'text-primary underline'
                                            }
                                        >
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Link>
                                    ) : null,
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
