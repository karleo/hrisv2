import { Head, Link, router } from '@inertiajs/react';
import { Clock, Download, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
    AttendanceEvidenceCell,
    AttendanceRemarksCell,
    type AttendanceRemarksEvidence,
} from '@/components/attendance-entry-cells';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { formatDisplayDate } from '@/lib/format-display-date';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Time & attendance', href: '/time-attendance' },
    { title: 'Attendance management', href: '/attendance-management' },
];

type ReportFilters = {
    from: string;
    to: string;
    employee_id?: string;
    company_profile_id?: string;
    biometric_device_id?: string;
    source?: string;
};

type ReportRow = AttendanceRemarksEvidence & {
    date: string;
    employee_id: number | null;
    employee_name: string;
    employee_code: string | null;
    company_name: string | null;
    device_pin: string;
    device_name: string | null;
    clock_in: string | null;
    clock_out: string | null;
    working_hours: string;
    overtime: string;
    punch_count: number;
    source?: 'biometric' | 'manual' | 'merged';
    work_mode_label?: string | null;
    time_entry_id?: number | null;
    daily_summary?: string | null;
};

type Summary = {
    total_employees: number;
    total_days: number;
    total_working_minutes: number;
    total_overtime_minutes: number;
    total_punches: number;
    total_manual_entries?: number;
    total_biometric_punches?: number;
};

function sourceLabel(source: ReportRow['source']): string {
    switch (source) {
        case 'manual':
            return 'Web check-in';
        case 'merged':
            return 'Biometric + Web';
        default:
            return 'Biometric / upload';
    }
}

function formatMinutes(minutes: number): string {
    if (minutes <= 0) {
        return '0m';
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) {
        return `${m}m`;
    }
    if (m === 0) {
        return `${h}h`;
    }
    return `${h}h ${m}m`;
}

function toDatetimeLocalValue(date: string, time: string | null): string {
    if (!time) {
        return '';
    }
    return `${date}T${time.slice(0, 5)}`;
}

function datetimeLocalToServer(value: string): string {
    return value.replace('T', ' ') + ':00';
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
    if (filters.company_profile_id) {
        params.company_profile_id = filters.company_profile_id;
    }
    if (filters.biometric_device_id) {
        params.biometric_device_id = filters.biometric_device_id;
    }
    if (filters.source && filters.source !== 'all') {
        params.source = filters.source;
    }

    return params;
}

export default function AttendanceManagementIndex({
    rows,
    filters,
    summary,
    employees,
    companies,
    devices,
    canChooseEmployee = true,
    canChooseCompany = false,
    canManageEntries = false,
    canDeleteEntries = false,
    canModifyOvertime = false,
}: {
    rows: {
        data: ReportRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        last_page: number;
        current_page: number;
    };
    filters: ReportFilters;
    summary: Summary;
    employees: Array<{
        id: number;
        name: string;
        employee_code: string;
        biometric_user_id: string | null;
    }>;
    companies: Array<{ id: number; name: string }>;
    devices: Array<{ id: number; name: string }>;
    canChooseEmployee?: boolean;
    canChooseCompany?: boolean;
    canManageEntries?: boolean;
    canDeleteEntries?: boolean;
    canModifyOvertime?: boolean;
}) {
    const [localFilters, setLocalFilters] = useState<ReportFilters>({
        ...filters,
        source: filters.source ?? 'all',
    });

    const [addOpen, setAddOpen] = useState(false);
    const [addEmployeeId, setAddEmployeeId] = useState(String(employees[0]?.id ?? ''));
    const [addClockIn, setAddClockIn] = useState('');
    const [addClockOut, setAddClockOut] = useState('');
    const [addSubmitting, setAddSubmitting] = useState(false);

    const [editingRow, setEditingRow] = useState<ReportRow | null>(null);
    const [editClockIn, setEditClockIn] = useState('');
    const [editClockOut, setEditClockOut] = useState('');
    const [editSummary, setEditSummary] = useState('');
    const [editSubmitting, setEditSubmitting] = useState(false);

    const [overtimeRow, setOvertimeRow] = useState<ReportRow | null>(null);
    const [overtimeMinutes, setOvertimeMinutes] = useState('');
    const [overtimeSubmitting, setOvertimeSubmitting] = useState(false);

    const selectedEmployee = employees.find(
        (employee) => String(employee.id) === (localFilters.employee_id ?? ''),
    );

    useEffect(() => {
        setLocalFilters({
            ...filters,
            source: filters.source ?? 'all',
        });
    }, [filters]);

    const loadReport = useCallback((next: ReportFilters) => {
        if (!next.from || !next.to) {
            return;
        }

        router.get('/attendance-management', filtersToParams(next), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['rows', 'filters', 'summary', 'employees'],
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

    const showActions = canManageEntries || canDeleteEntries || canModifyOvertime;

    const handleAddSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!addEmployeeId || !addClockIn) {
            return;
        }

        setAddSubmitting(true);
        router.post(
            '/time-attendance',
            {
                employee_id: Number(addEmployeeId),
                clock_in_at: datetimeLocalToServer(addClockIn),
                ...(addClockOut ? { clock_out_at: datetimeLocalToServer(addClockOut) } : {}),
            },
            {
                onFinish: () => {
                    setAddSubmitting(false);
                    setAddOpen(false);
                },
                onSuccess: () => loadReport(localFilters),
            },
        );
    };

    const openEditDialog = (row: ReportRow) => {
        setEditingRow(row);
        setEditClockIn(toDatetimeLocalValue(row.date, row.clock_in));
        setEditClockOut(toDatetimeLocalValue(row.date, row.clock_out));
        setEditSummary(row.daily_summary ?? '');
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingRow?.time_entry_id) {
            return;
        }

        setEditSubmitting(true);
        router.patch(
            `/time-attendance/${editingRow.time_entry_id}`,
            {
                clock_in_at: datetimeLocalToServer(editClockIn),
                clock_out_at: editClockOut ? datetimeLocalToServer(editClockOut) : null,
                daily_summary: editSummary,
            },
            {
                onFinish: () => {
                    setEditSubmitting(false);
                    setEditingRow(null);
                },
                onSuccess: () => loadReport(localFilters),
            },
        );
    };

    const handleAddCorrection = (row: ReportRow) => {
        if (!row.employee_id) {
            return;
        }

        setAddEmployeeId(String(row.employee_id));
        setAddClockIn(toDatetimeLocalValue(row.date, row.clock_in));
        setAddClockOut(toDatetimeLocalValue(row.date, row.clock_out));
        setAddOpen(true);
    };

    const handleDelete = (row: ReportRow) => {
        if (!row.time_entry_id || !confirm('Remove this attendance entry?')) {
            return;
        }

        router.delete(`/time-attendance/${row.time_entry_id}`, {
            onSuccess: () => loadReport(localFilters),
        });
    };

    const openOvertimeDialog = (row: ReportRow) => {
        setOvertimeRow(row);
        const match = row.overtime.match(/(\d+)h(?:\s*(\d+)m)?/);
        let minutes = 0;
        if (match) {
            minutes = Number(match[1]) * 60 + Number(match[2] ?? 0);
        }
        setOvertimeMinutes(String(minutes));
    };

    const handleOvertimeSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!overtimeRow?.time_entry_id) {
            return;
        }

        setOvertimeSubmitting(true);
        router.patch(
            `/time-attendance/${overtimeRow.time_entry_id}`,
            { overtime_minutes: Number(overtimeMinutes) },
            {
                onFinish: () => {
                    setOvertimeSubmitting(false);
                    setOvertimeRow(null);
                },
                onSuccess: () => loadReport(localFilters),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance management" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Attendance management"
                        description="Review and correct attendance from biometrics, web check-in, and file uploads. Overtime is computed from worked time and schedules."
                    />
                    {canManageEntries && (
                        <Button className="gap-1.5" onClick={() => setAddOpen(true)}>
                            <Plus className="size-4" />
                            Add attendance
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-2xl font-bold">{summary.total_employees}</p>
                            <p className="text-muted-foreground mt-1 text-xs">Employees</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-2xl font-bold">{summary.total_days}</p>
                            <p className="text-muted-foreground mt-1 text-xs">Attendance days</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-2xl font-bold">{formatMinutes(summary.total_working_minutes)}</p>
                            <p className="text-muted-foreground mt-1 text-xs">Total worked</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                {formatMinutes(summary.total_overtime_minutes)}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">Overtime</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filters</CardTitle>
                        <p className="text-muted-foreground text-sm">
                            Filter by company, employee, date range, device, or attendance source.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                            <div>
                                <Label htmlFor="mgmt-from">From</Label>
                                <Input
                                    id="mgmt-from"
                                    type="date"
                                    value={localFilters.from}
                                    required
                                    onChange={(e) => updateFilters({ from: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="mgmt-to">To</Label>
                                <Input
                                    id="mgmt-to"
                                    type="date"
                                    value={localFilters.to}
                                    required
                                    onChange={(e) => updateFilters({ to: e.target.value })}
                                />
                            </div>
                            {canChooseCompany && (
                                <div>
                                    <Label htmlFor="mgmt-company">Company</Label>
                                    <NativeSelect
                                        id="mgmt-company"
                                        value={localFilters.company_profile_id ?? ''}
                                        onChange={(e) =>
                                            updateFilters({
                                                company_profile_id: e.target.value || undefined,
                                                employee_id: undefined,
                                            })
                                        }
                                    >
                                        <option value="">All companies</option>
                                        {companies.map((company) => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </div>
                            )}
                            <div>
                                <Label htmlFor="mgmt-employee">Employee</Label>
                                {canChooseEmployee ? (
                                    <NativeSelect
                                        id="mgmt-employee"
                                        value={localFilters.employee_id ?? ''}
                                        onChange={(e) =>
                                            updateFilters({
                                                employee_id: e.target.value || undefined,
                                            })
                                        }
                                    >
                                        <option value="">All employees</option>
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
                                        id="mgmt-employee"
                                        readOnly
                                        value={selectedEmployee?.name ?? '—'}
                                        className="bg-muted/40"
                                    />
                                )}
                            </div>
                            <div>
                                <Label htmlFor="mgmt-source">Source</Label>
                                <NativeSelect
                                    id="mgmt-source"
                                    value={localFilters.source ?? 'all'}
                                    onChange={(e) => updateFilters({ source: e.target.value })}
                                >
                                    <option value="all">All sources</option>
                                    <option value="biometric">Biometric / upload</option>
                                    <option value="manual">Web check-in</option>
                                    <option value="merged">Biometric + Web</option>
                                </NativeSelect>
                            </div>
                            <div>
                                <Label htmlFor="mgmt-device">Device</Label>
                                <NativeSelect
                                    id="mgmt-device"
                                    value={localFilters.biometric_device_id ?? ''}
                                    onChange={(e) =>
                                        updateFilters({
                                            biometric_device_id: e.target.value || undefined,
                                        })
                                    }
                                >
                                    <option value="">All devices</option>
                                    {devices.map((device) => (
                                        <option key={device.id} value={device.id}>
                                            {device.name}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button type="button" variant="outline" asChild>
                                <a href={`/attendance-management?${exportQuery('csv')}`}>
                                    <Download className="mr-2 size-4" />
                                    Export CSV
                                </a>
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <a href={`/attendance-management?${exportQuery('pdf')}`}>
                                    <FileText className="mr-2 size-4" />
                                    Download PDF
                                </a>
                            </Button>
                            <Button type="button" variant="ghost" asChild>
                                <Link href="/biometric-attendance/upload">Upload biometric file</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Attendance records</CardTitle>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {summary.total_days} day row(s) · {summary.total_biometric_punches ?? summary.total_punches}{' '}
                            biometric punch(es)
                            {(summary.total_manual_entries ?? 0) > 0
                                ? ` · ${summary.total_manual_entries} web check-in(s)`
                                : ''}
                        </p>
                    </CardHeader>
                    <CardContent>
                        {rows.data.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No attendance for this range. Import biometric punches or add web attendance, then
                                adjust filters above.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="py-2 pr-4">Date</th>
                                            {canChooseCompany && <th className="py-2 pr-4">Company</th>}
                                            <th className="py-2 pr-4">Employee</th>
                                            <th className="py-2 pr-4">Source</th>
                                            <th className="py-2 pr-4">Clock in</th>
                                            <th className="py-2 pr-4">Clock out</th>
                                            <th className="py-2 pr-4">Worked</th>
                                            <th className="py-2 pr-4">Overtime</th>
                                            <th className="py-2 pr-4">Notes</th>
                                            <th className="py-2 pr-4">Remarks</th>
                                            <th className="py-2 pr-4">Evidence</th>
                                            {showActions && <th className="py-2 text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.data.map((row, index) => (
                                            <tr
                                                key={`${row.date}-${row.employee_id ?? 'u'}-${index}`}
                                                className="border-b border-border/60"
                                            >
                                                <td className="py-2 pr-4">{formatDisplayDate(row.date)}</td>
                                                {canChooseCompany && (
                                                    <td className="py-2 pr-4">{row.company_name ?? '—'}</td>
                                                )}
                                                <td className="py-2 pr-4">
                                                    <div>{row.employee_name}</div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {row.employee_code ?? '—'}
                                                    </div>
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <div>{sourceLabel(row.source)}</div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {row.work_mode_label ?? row.device_name ?? '—'}
                                                    </div>
                                                </td>
                                                <td className="py-2 pr-4 font-mono text-xs">{row.clock_in ?? '—'}</td>
                                                <td className="py-2 pr-4 font-mono text-xs">{row.clock_out ?? '—'}</td>
                                                <td className="py-2 pr-4">{row.working_hours}</td>
                                                <td className="py-2 pr-4 text-amber-700 dark:text-amber-400">
                                                    {row.overtime}
                                                </td>
                                                <td className="max-w-[140px] truncate py-2 pr-4 text-xs">
                                                    {row.daily_summary ?? '—'}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <AttendanceRemarksCell row={row} />
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <AttendanceEvidenceCell row={row} />
                                                </td>
                                                {showActions && (
                                                    <td className="py-2 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            {canManageEntries && row.time_entry_id && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => openEditDialog(row)}
                                                                    aria-label="Edit attendance"
                                                                >
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                            )}
                                                            {canManageEntries && !row.time_entry_id && row.employee_id && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleAddCorrection(row)}
                                                                    aria-label="Add correction"
                                                                >
                                                                    <Plus className="size-4" />
                                                                </Button>
                                                            )}
                                                            {canModifyOvertime && row.time_entry_id && row.clock_out && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => openOvertimeDialog(row)}
                                                                    aria-label="Edit overtime"
                                                                >
                                                                    <Clock className="size-4" />
                                                                </Button>
                                                            )}
                                                            {canDeleteEntries && row.time_entry_id && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={() => handleDelete(row)}
                                                                    aria-label="Delete entry"
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
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

                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogContent>
                        <DialogTitle>Add attendance</DialogTitle>
                        <DialogDescription>
                            Create a web attendance entry. Overtime is computed automatically when check-out is set.
                        </DialogDescription>
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="add_employee">Employee</Label>
                                <NativeSelect
                                    id="add_employee"
                                    value={addEmployeeId}
                                    onChange={(e) => setAddEmployeeId(e.target.value)}
                                    required
                                >
                                    {employees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="add_clock_in">Check-in</Label>
                                    <Input
                                        id="add_clock_in"
                                        type="datetime-local"
                                        value={addClockIn}
                                        onChange={(e) => setAddClockIn(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="add_clock_out">Check-out</Label>
                                    <Input
                                        id="add_clock_out"
                                        type="datetime-local"
                                        value={addClockOut}
                                        onChange={(e) => setAddClockOut(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={addSubmitting}>
                                    {addSubmitting ? 'Saving…' : 'Save attendance'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={editingRow !== null} onOpenChange={(open) => !open && setEditingRow(null)}>
                    <DialogContent>
                        <DialogTitle>Edit attendance</DialogTitle>
                        <DialogDescription>
                            Update times for {editingRow?.employee_name} on{' '}
                            {editingRow ? formatDisplayDate(editingRow.date) : ''}. Overtime recalculates on save.
                        </DialogDescription>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="edit_clock_in">Check-in</Label>
                                    <Input
                                        id="edit_clock_in"
                                        type="datetime-local"
                                        value={editClockIn}
                                        onChange={(e) => setEditClockIn(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="edit_clock_out">Check-out</Label>
                                    <Input
                                        id="edit_clock_out"
                                        type="datetime-local"
                                        value={editClockOut}
                                        onChange={(e) => setEditClockOut(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="edit_summary">Daily summary</Label>
                                <Textarea
                                    id="edit_summary"
                                    value={editSummary}
                                    onChange={(e) => setEditSummary(e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={editSubmitting}>
                                    {editSubmitting ? 'Saving…' : 'Save changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={overtimeRow !== null} onOpenChange={(open) => !open && setOvertimeRow(null)}>
                    <DialogContent>
                        <DialogTitle>Edit overtime</DialogTitle>
                        <DialogDescription>
                            Adjust overtime minutes for {overtimeRow?.employee_name} on{' '}
                            {overtimeRow ? formatDisplayDate(overtimeRow.date) : ''}.
                        </DialogDescription>
                        <form onSubmit={handleOvertimeSubmit} className="space-y-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="ot_minutes">Overtime (minutes)</Label>
                                <Input
                                    id="ot_minutes"
                                    type="number"
                                    min={0}
                                    max={1440}
                                    value={overtimeMinutes}
                                    onChange={(e) => setOvertimeMinutes(e.target.value)}
                                    required
                                />
                                <p className="text-muted-foreground text-xs">
                                    Computed from schedule: {overtimeRow?.overtime ?? '—'}
                                </p>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={overtimeSubmitting}>
                                    {overtimeSubmitting ? 'Saving…' : 'Save overtime'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
