import { Head, Link, router, usePage } from '@inertiajs/react';
import { Camera, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AttendanceCheckInDialog, type WorkModeOption } from '@/components/attendance-check-in-dialog';
import { AttendanceCheckOutDialog } from '@/components/attendance-check-out-dialog';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { Textarea } from '@/components/ui/textarea';
import { WEEKDAY_LABELS } from '@/components/work-timetable-day-fields';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type WorkScheduleRow = {
    weekday: number;
    weekday_label: string;
    is_rest_day: boolean;
    work_starts_at: string | null;
    work_ends_at: string | null;
    expected_minutes: number;
};

type TimeEntryRow = {
    id: number;
    employee_id: number;
    employee_name: string;
    clock_in_at: string;
    clock_out_at: string | null;
    daily_summary: string | null;
    work_mode: string | null;
    work_mode_label: string;
    requires_field_evidence: boolean;
    check_in_remarks: string | null;
    check_out_remarks: string | null;
    has_check_in_photo: boolean;
    has_check_out_photo: boolean;
    check_in_photo_url: string | null;
    check_out_photo_url: string | null;
    check_in_latitude: number | null;
    check_in_longitude: number | null;
    check_out_latitude: number | null;
    check_out_longitude: number | null;
    worked_minutes: number | null;
    overtime_minutes: number | null;
    expected_minutes: number | null;
    minutes_variance: number | null;
    expected_label: string;
    check_in_status_label: string;
    check_out_status_label: string;
};

type OpenEntry = {
    source: 'manual' | 'biometric';
    id: number | null;
    biometric_session_id: number | null;
    clock_in_at: string;
    work_mode: string | null;
    work_mode_label: string;
    requires_field_evidence: boolean;
};

type EmployeeOption = { id: number; name: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Time & attendance', href: '/time-attendance' },
];

function formatMinutes(m: number | null | undefined): string {
    if (m == null) {
        return '—';
    }
    const h = Math.floor(m / 60);
    const min = m % 60;

    return `${h}h ${min}m`;
}

function formatVarianceMinutes(v: number | null | undefined): string {
    if (v == null) {
        return '—';
    }
    if (v === 0) {
        return '0m';
    }
    const sign = v > 0 ? '+' : '';

    return `${sign}${v}m`;
}

// Build a small Google Maps link for a lat/lng pair
function mapsLink(lat: number, lng: number): string {
    return `https://maps.google.com/?q=${lat},${lng}`;
}

function toDatetimeLocalValue(iso: string | null): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function datetimeLocalToServer(value: string): string {
    return value.replace('T', ' ') + ':00';
}

export default function TimeAttendanceIndex({
    entries,
    filters,
    workSchedule,
    graceMinutes,
    openEntry,
    canCheckIn,
    canManageEntries,
    canDeleteEntries,
    canModifyOvertime,
    canChooseEmployee = true,
    employeesForCheckIn,
    workModeOptions,
}: {
    entries: {
        data: TimeEntryRow[];
        current_page: number;
        last_page: number;
    };
    filters: { from?: string; to?: string };
    workSchedule: WorkScheduleRow[] | null;
    graceMinutes: number;
    openEntry: OpenEntry | null;
    canCheckIn: boolean;
    canManageEntries: boolean;
    canDeleteEntries: boolean;
    canModifyOvertime: boolean;
    canChooseEmployee?: boolean;
    employeesForCheckIn: EmployeeOption[];
    workModeOptions: WorkModeOption[];
}) {
    const page = usePage();
    const { flash } = page.props as { flash?: { success?: string } };
    const pageErrors = (page.props as { errors?: Record<string, string> }).errors;
    const { data: rows, current_page, last_page } = entries;
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    // Manager check-in form (dropdown + optional manual times)
    const [managerEmployeeId, setManagerEmployeeId] = useState<number | ''>(
        employeesForCheckIn[0]?.id ?? ''
    );
    const [managerClockIn, setManagerClockIn] = useState('');
    const [managerClockOut, setManagerClockOut] = useState('');
    const [managerSubmitting, setManagerSubmitting] = useState(false);

    const [editingEntry, setEditingEntry] = useState<TimeEntryRow | null>(null);
    const [editClockIn, setEditClockIn] = useState('');
    const [editClockOut, setEditClockOut] = useState('');
    const [editSummary, setEditSummary] = useState('');
    const [editSubmitting, setEditSubmitting] = useState(false);

    const [overtimeEntry, setOvertimeEntry] = useState<TimeEntryRow | null>(null);
    const [overtimeMinutes, setOvertimeMinutes] = useState('');
    const [overtimeSubmitting, setOvertimeSubmitting] = useState(false);

    const showManagerCheckIn = canManageEntries && employeesForCheckIn.length > 0;
    const showActionsColumn = canManageEntries || canDeleteEntries || canModifyOvertime;

    const filterSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/time-attendance',
            {
                from: from || undefined,
                to: to || undefined,
            },
            { preserveState: true }
        );
    };

    const handleDelete = (id: number) => {
        if (confirm('Remove this time entry?')) {
            router.delete(`/time-attendance/${id}`);
        }
    };

    const handleManagerCheckIn = (e: FormEvent) => {
        e.preventDefault();
        if (!managerEmployeeId) {
            return;
        }
        setManagerSubmitting(true);
        router.post(
            '/time-attendance',
            {
                employee_id: managerEmployeeId,
                ...(managerClockIn ? { clock_in_at: datetimeLocalToServer(managerClockIn) } : {}),
                ...(managerClockOut ? { clock_out_at: datetimeLocalToServer(managerClockOut) } : {}),
            },
            {
                onFinish: () => setManagerSubmitting(false),
            }
        );
    };

    const openEditDialog = (row: TimeEntryRow) => {
        setEditingEntry(row);
        setEditClockIn(toDatetimeLocalValue(row.clock_in_at));
        setEditClockOut(toDatetimeLocalValue(row.clock_out_at));
        setEditSummary(row.daily_summary ?? '');
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingEntry) {
            return;
        }

        setEditSubmitting(true);
        router.patch(
            `/time-attendance/${editingEntry.id}`,
            {
                clock_in_at: datetimeLocalToServer(editClockIn),
                clock_out_at: editClockOut ? datetimeLocalToServer(editClockOut) : null,
                daily_summary: editSummary,
            },
            {
                onFinish: () => {
                    setEditSubmitting(false);
                    setEditingEntry(null);
                },
            }
        );
    };

    const openOvertimeDialog = (row: TimeEntryRow) => {
        setOvertimeEntry(row);
        setOvertimeMinutes(String(row.overtime_minutes ?? 0));
    };

    const handleOvertimeSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!overtimeEntry) {
            return;
        }

        setOvertimeSubmitting(true);
        router.patch(
            `/time-attendance/${overtimeEntry.id}`,
            {
                overtime_minutes: Number(overtimeMinutes),
            },
            {
                onFinish: () => {
                    setOvertimeSubmitting(false);
                    setOvertimeEntry(null);
                },
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Time & attendance" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Time & attendance"
                    description="Check in and out against your tagged work timetable. Status uses a grace window around scheduled start/end."
                />
                <p className="text-muted-foreground max-w-2xl text-sm">
                    Grace window: ±{graceMinutes} minutes from scheduled time
                    counts as on time. Under time / overtime on check-out compares
                    to scheduled end.
                </p>

                {flash?.success && (
                    <p className="bg-muted text-foreground rounded-md border px-3 py-2 text-sm">
                        {flash.success}
                    </p>
                )}

                {workSchedule && workSchedule.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="size-4" />
                                My tagged work timetable
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="pb-2 pr-4 font-medium">Day</th>
                                            <th className="pb-2 pr-4 font-medium">Schedule</th>
                                            <th className="pb-2 font-medium">Expected</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workSchedule.map((d) => (
                                            <tr key={d.weekday} className="border-b border-border/60">
                                                <td className="py-2 pr-4">
                                                    {WEEKDAY_LABELS[d.weekday] ?? d.weekday_label}
                                                </td>
                                                <td className="text-muted-foreground py-2 pr-4">
                                                    {d.is_rest_day
                                                        ? 'Rest day'
                                                        : `${d.work_starts_at?.toString().slice(0, 5) ?? ''} – ${d.work_ends_at?.toString().slice(0, 5) ?? ''}`}
                                                </td>
                                                <td className="py-2">
                                                    {d.is_rest_day
                                                        ? '—'
                                                        : formatMinutes(d.expected_minutes)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    {/* Check-in card */}
                    {canCheckIn && (
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle className="text-base">Check in</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {showManagerCheckIn ? (
                                    <form onSubmit={handleManagerCheckIn} className="space-y-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="employee_id">Employee</Label>
                                            <select
                                                id="employee_id"
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark]"
                                                value={managerEmployeeId}
                                                onChange={(e) =>
                                                    setManagerEmployeeId(Number(e.target.value))
                                                }
                                                required
                                            >
                                                {employeesForCheckIn.map((em) => (
                                                    <option
                                                        key={em.id}
                                                        value={em.id}
                                                        className="bg-background text-foreground"
                                                    >
                                                        {em.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={pageErrors?.employee_id} />
                                            <InputError message={pageErrors?.check_in} />
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="grid gap-1">
                                                <Label htmlFor="manager_clock_in">Check-in (optional)</Label>
                                                <Input
                                                    id="manager_clock_in"
                                                    type="datetime-local"
                                                    value={managerClockIn}
                                                    onChange={(e) => setManagerClockIn(e.target.value)}
                                                />
                                                <p className="text-muted-foreground text-xs">Leave blank to use the current time.</p>
                                            </div>
                                            <div className="grid gap-1">
                                                <Label htmlFor="manager_clock_out">Check-out (optional)</Label>
                                                <Input
                                                    id="manager_clock_out"
                                                    type="datetime-local"
                                                    value={managerClockOut}
                                                    onChange={(e) => setManagerClockOut(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={managerSubmitting || !employeesForCheckIn.length}
                                        >
                                            {managerClockOut ? 'Save attendance' : 'Check in now'}
                                        </Button>
                                    </form>
                                ) : (
                                    // Employees use the dialog with work mode + optional evidence
                                    <>
                                        <AttendanceCheckInDialog
                                            workModeOptions={workModeOptions}
                                            trigger={<Button>Check in now</Button>}
                                        />
                                        <InputError message={pageErrors?.check_in} />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Check-out card */}
                    {openEntry && !showManagerCheckIn && (
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle className="text-base">Check out</CardTitle>
                                <p className="text-muted-foreground text-sm">
                                    Open since {new Date(openEntry.clock_in_at).toLocaleString()}
                                    {' · '}
                                    {openEntry.work_mode_label}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <AttendanceCheckOutDialog
                                    openEntry={openEntry}
                                    trigger={<Button variant="outline">Check out now</Button>}
                                />
                                <InputError message={pageErrors?.check_out} />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Date filter */}
                <form
                    onSubmit={filterSubmit}
                    className="flex flex-wrap items-end gap-2"
                >
                    <div className="grid gap-1">
                        <Label htmlFor="filter_from">From</Label>
                        <Input
                            id="filter_from"
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="w-auto"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="filter_to">To</Label>
                        <Input
                            id="filter_to"
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="w-auto"
                        />
                    </div>
                    <Button type="submit" variant="secondary">Filter</Button>
                    <Button type="button" variant="ghost" asChild>
                        <Link href="/time-attendance">Clear</Link>
                    </Button>
                </form>

                {/* History table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rows.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                No time entries yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            {canChooseEmployee && (
                                                <th className="pb-2 pr-4 font-medium">Employee</th>
                                            )}
                                            <th className="pb-2 pr-4 font-medium">Mode</th>
                                            <th className="pb-2 pr-4 font-medium">In</th>
                                            <th className="pb-2 pr-4 font-medium">Out</th>
                                            <th className="pb-2 pr-4 font-medium">Scheduled</th>
                                            <th className="pb-2 pr-4 font-medium">Check-in</th>
                                            <th className="pb-2 pr-4 font-medium">Check-out</th>
                                            <th className="pb-2 pr-4 font-medium">Worked</th>
                                            <th className="pb-2 pr-4 font-medium">Overtime</th>
                                            <th className="pb-2 pr-4 font-medium">vs sched.</th>
                                            <th className="pb-2 pr-4 font-medium">Remarks</th>
                                            <th className="pb-2 pr-4 font-medium">Evidence</th>
                                            {showActionsColumn && (
                                                <th className="pb-2 text-right font-medium">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <tr key={row.id} className="border-b border-border/60">
                                                {canChooseEmployee && (
                                                    <td className="py-2 pr-4">{row.employee_name}</td>
                                                )}
                                                <td className="py-2 pr-4">
                                                    <span className="text-muted-foreground text-xs">
                                                        {row.work_mode_label}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {new Date(row.clock_in_at).toLocaleString()}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {row.clock_out_at
                                                        ? new Date(row.clock_out_at).toLocaleString()
                                                        : '—'}
                                                </td>
                                                <td className="text-muted-foreground py-2 pr-4">
                                                    {row.expected_label}
                                                </td>
                                                <td className="py-2 pr-4">{row.check_in_status_label}</td>
                                                <td className="py-2 pr-4">{row.check_out_status_label}</td>
                                                <td className="py-2 pr-4">
                                                    {formatMinutes(row.worked_minutes)}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {row.overtime_minutes != null && row.overtime_minutes > 0 ? (
                                                        <span className="text-amber-700 dark:text-amber-400">
                                                            {formatMinutes(row.overtime_minutes)}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td
                                                    className={`py-2 pr-4 ${row.minutes_variance != null && row.minutes_variance > 0 ? 'text-amber-700 dark:text-amber-400' : ''} ${row.minutes_variance != null && row.minutes_variance < 0 ? 'text-muted-foreground' : ''}`}
                                                >
                                                    {formatVarianceMinutes(row.minutes_variance)}
                                                </td>
                                                <td className="max-w-[180px] whitespace-pre-wrap py-2 pr-4 text-xs">
                                                    {row.check_in_remarks && (
                                                        <div>
                                                            <span className="text-muted-foreground font-medium">In:</span>{' '}
                                                            {row.check_in_remarks}
                                                        </div>
                                                    )}
                                                    {row.check_out_remarks && (
                                                        <div>
                                                            <span className="text-muted-foreground font-medium">Out:</span>{' '}
                                                            {row.check_out_remarks}
                                                        </div>
                                                    )}
                                                    {!row.check_in_remarks && !row.check_out_remarks && '—'}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        {row.check_in_latitude != null && row.check_in_longitude != null && (
                                                            <a
                                                                href={mapsLink(row.check_in_latitude, row.check_in_longitude)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary flex items-center gap-1 underline-offset-2 hover:underline"
                                                            >
                                                                <MapPin className="size-3" />
                                                                In
                                                            </a>
                                                        )}
                                                        {row.check_out_latitude != null && row.check_out_longitude != null && (
                                                            <a
                                                                href={mapsLink(row.check_out_latitude, row.check_out_longitude)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary flex items-center gap-1 underline-offset-2 hover:underline"
                                                            >
                                                                <MapPin className="size-3" />
                                                                Out
                                                            </a>
                                                        )}
                                                        {row.check_in_photo_url && (
                                                            <a
                                                                href={row.check_in_photo_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary flex items-center gap-1 underline-offset-2 hover:underline"
                                                            >
                                                                <Camera className="size-3" />
                                                                Photo In
                                                            </a>
                                                        )}
                                                        {row.check_out_photo_url && (
                                                            <a
                                                                href={row.check_out_photo_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary flex items-center gap-1 underline-offset-2 hover:underline"
                                                            >
                                                                <Camera className="size-3" />
                                                                Photo Out
                                                            </a>
                                                        )}
                                                        {!row.check_in_latitude
                                                            && !row.check_out_latitude
                                                            && !row.check_in_photo_url
                                                            && !row.check_out_photo_url
                                                            && '—'}
                                                    </div>
                                                </td>
                                                {showActionsColumn && (
                                                    <td className="py-2 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            {canManageEntries && (
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
                                                            {canModifyOvertime && row.clock_out_at && (
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
                                                            {canDeleteEntries && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={() => handleDelete(row.id)}
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
                        {last_page > 1 && (
                            <div className="mt-4 flex justify-center gap-2 text-sm">
                                {current_page > 1 && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={`/time-attendance?page=${current_page - 1}${from ? `&from=${encodeURIComponent(from)}` : ''}${to ? `&to=${encodeURIComponent(to)}` : ''}`}
                                            preserveState
                                        >
                                            Previous
                                        </Link>
                                    </Button>
                                )}
                                <span className="text-muted-foreground flex items-center px-2">
                                    Page {current_page} / {last_page}
                                </span>
                                {current_page < last_page && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={`/time-attendance?page=${current_page + 1}${from ? `&from=${encodeURIComponent(from)}` : ''}${to ? `&to=${encodeURIComponent(to)}` : ''}`}
                                            preserveState
                                        >
                                            Next
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={editingEntry !== null} onOpenChange={(open) => !open && setEditingEntry(null)}>
                    <DialogContent>
                        <DialogTitle>Edit attendance</DialogTitle>
                        <DialogDescription>
                            Update check-in and check-out times for {editingEntry?.employee_name}.
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

                <Dialog open={overtimeEntry !== null} onOpenChange={(open) => !open && setOvertimeEntry(null)}>
                    <DialogContent>
                        <DialogTitle>Edit overtime</DialogTitle>
                        <DialogDescription>
                            Adjust overtime minutes for {overtimeEntry?.employee_name} on{' '}
                            {overtimeEntry ? new Date(overtimeEntry.clock_in_at).toLocaleDateString() : ''}.
                        </DialogDescription>
                        <form onSubmit={handleOvertimeSubmit} className="space-y-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="overtime_minutes">Overtime (minutes)</Label>
                                <Input
                                    id="overtime_minutes"
                                    type="number"
                                    min={0}
                                    max={1440}
                                    value={overtimeMinutes}
                                    onChange={(e) => setOvertimeMinutes(e.target.value)}
                                    required
                                />
                                <p className="text-muted-foreground text-xs">
                                    Current worked time: {formatMinutes(overtimeEntry?.worked_minutes)}
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
