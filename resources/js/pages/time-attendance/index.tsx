import { Form, Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Clock, Trash2 } from 'lucide-react';
import type { FormEvent} from 'react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    worked_minutes: number | null;
    expected_minutes: number | null;
    minutes_variance: number | null;
    expected_label: string;
    check_in_status_label: string;
    check_out_status_label: string;
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

export default function TimeAttendanceIndex({
    entries,
    filters,
    workSchedule,
    graceMinutes,
    openEntry,
    canCheckIn,
    isAdministrator,
    employeesForCheckIn,
}: {
    entries: {
        data: TimeEntryRow[];
        current_page: number;
        last_page: number;
    };
    filters: { from?: string; to?: string };
    workSchedule: WorkScheduleRow[] | null;
    graceMinutes: number;
    openEntry: { id: number; clock_in_at: string } | null;
    canCheckIn: boolean;
    isAdministrator: boolean;
    employeesForCheckIn: EmployeeOption[];
}) {
    const page = usePage();
    const { flash } = page.props as { flash?: { success?: string } };
    const pageErrors = (page.props as { errors?: Record<string, string> })
        .errors;
    const { data: rows, current_page, last_page } = entries;
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    const checkInAdminForm = useForm({
        employee_id: employeesForCheckIn[0]?.id ?? ('' as number | ''),
    });

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
                                            <th className="pb-2 pr-4 font-medium">
                                                Day
                                            </th>
                                            <th className="pb-2 pr-4 font-medium">
                                                Schedule
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Expected
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workSchedule.map((d) => (
                                            <tr
                                                key={d.weekday}
                                                className="border-b border-border/60"
                                            >
                                                <td className="py-2 pr-4">
                                                    {WEEKDAY_LABELS[d.weekday] ??
                                                        d.weekday_label}
                                                </td>
                                                <td className="text-muted-foreground py-2 pr-4">
                                                    {d.is_rest_day
                                                        ? 'Rest day'
                                                        : `${d.work_starts_at?.toString().slice(0, 5) ?? ''} – ${d.work_ends_at?.toString().slice(0, 5) ?? ''}`}
                                                </td>
                                                <td className="py-2">
                                                    {d.is_rest_day
                                                        ? '—'
                                                        : formatMinutes(
                                                              d.expected_minutes
                                                          )}
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
                    {canCheckIn && (
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Check in
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {isAdministrator ? (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            checkInAdminForm.post(
                                                '/time-attendance'
                                            );
                                        }}
                                    >
                                        <div className="grid gap-2">
                                            <Label htmlFor="employee_id">
                                                Employee
                                            </Label>
                                            <select
                                                id="employee_id"
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                                value={
                                                    checkInAdminForm.data
                                                        .employee_id
                                                }
                                                onChange={(e) =>
                                                    checkInAdminForm.setData(
                                                        'employee_id',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                required
                                            >
                                                {employeesForCheckIn.map(
                                                    (em) => (
                                                        <option
                                                            key={em.id}
                                                            value={em.id}
                                                        >
                                                            {em.name}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            <InputError
                                                message={
                                                    checkInAdminForm.errors
                                                        .employee_id
                                                }
                                            />
                                            <InputError
                                                message={
                                                    checkInAdminForm.errors
                                                        .check_in
                                                }
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="mt-3"
                                            disabled={
                                                checkInAdminForm.processing ||
                                                !employeesForCheckIn.length
                                            }
                                        >
                                            Check in now
                                        </Button>
                                    </form>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                router.post('/time-attendance')
                                            }
                                        >
                                            Check in now
                                        </Button>
                                        <InputError
                                            message={pageErrors?.check_in}
                                        />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {openEntry && !isAdministrator && (
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Check out
                                </CardTitle>
                                <p className="text-muted-foreground text-sm">
                                    Open since{' '}
                                    {new Date(
                                        openEntry.clock_in_at
                                    ).toLocaleString()}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    action="/time-attendance/check-out"
                                    method="post"
                                    className="space-y-3"
                                >
                                    {({ errors, processing }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="daily_summary">
                                                    What did you work on today?
                                                    (optional)
                                                </Label>
                                                <textarea
                                                    id="daily_summary"
                                                    name="daily_summary"
                                                    rows={4}
                                                    maxLength={5000}
                                                    className="border-input focus-visible:ring-ring min-h-[100px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                                    placeholder="Notes or bullet list of tasks…"
                                                />
                                                <InputError
                                                    message={
                                                        errors.daily_summary
                                                    }
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                Check out
                                            </Button>
                                            <InputError
                                                message={errors.check_out}
                                            />
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>
                    )}
                </div>

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
                    <Button type="submit" variant="secondary">
                        Filter
                    </Button>
                    <Button type="button" variant="ghost" asChild>
                        <Link href="/time-attendance">Clear</Link>
                    </Button>
                </form>

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
                                            <th className="pb-2 pr-4 font-medium">
                                                Employee
                                            </th>
                                            <th className="pb-2 pr-4 font-medium">
                                                In
                                            </th>
                                            <th className="pb-2 pr-4 font-medium">
                                                Out
                                            </th>
                                            <th className="pb-2 pr-4 font-medium">
                                                Scheduled
                                            </th>
                                            <th className="pb-2 pr-4 font-medium">
                                                Check-in
                                            </th>
                                            <th className="pb-2 pr-4 font-medium">
                                                Check-out
                                            </th>
                                            <th className="pb-2 pr-4 font-medium">
                                                Worked
                                            </th>
                                            <th className="pb-2 pr-4 font-medium">
                                                vs sched.
                                            </th>
                                            <th className="pb-2 pr-4 font-medium">
                                                Daily summary
                                            </th>
                                            {isAdministrator && (
                                                <th className="pb-2 text-right font-medium">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-b border-border/60"
                                            >
                                                <td className="py-2 pr-4">
                                                    {row.employee_name}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {new Date(
                                                        row.clock_in_at
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {row.clock_out_at
                                                        ? new Date(
                                                              row.clock_out_at
                                                          ).toLocaleString()
                                                        : '—'}
                                                </td>
                                                <td className="text-muted-foreground py-2 pr-4">
                                                    {row.expected_label}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {
                                                        row.check_in_status_label
                                                    }
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {
                                                        row.check_out_status_label
                                                    }
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {formatMinutes(
                                                        row.worked_minutes
                                                    )}
                                                </td>
                                                <td
                                                    className={`py-2 pr-4 ${row.minutes_variance != null && row.minutes_variance > 0 ? 'text-amber-700 dark:text-amber-400' : ''} ${row.minutes_variance != null && row.minutes_variance < 0 ? 'text-muted-foreground' : ''}`}
                                                >
                                                    {formatVarianceMinutes(
                                                        row.minutes_variance
                                                    )}
                                                </td>
                                                <td className="max-w-[240px] whitespace-pre-wrap py-2 pr-4">
                                                    {row.daily_summary ??
                                                        '—'}
                                                </td>
                                                {isAdministrator && (
                                                    <td className="py-2 text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    row.id
                                                                )
                                                            }
                                                            aria-label="Delete entry"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
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
            </div>
        </AppLayout>
    );
}
