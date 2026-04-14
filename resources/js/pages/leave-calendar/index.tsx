import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Filter, Layers3, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type LeaveCalendarEntry = {
    id: number;
    employee_name: string;
    department_name: string;
    leave_type: string;
    leave_category: 'paid' | 'unpaid' | string;
    period_from: string;
    period_to: string;
    days: number;
};

type DepartmentOption = {
    id: number;
    name: string;
};

type LeaveTypeOption = {
    name: string;
    leave_category: 'paid' | 'unpaid' | string;
};

type DepartmentSummary = {
    department_name: string;
    leave_entries: number;
    total_days: number;
    employees_on_leave: number;
};

type CalendarMeta = {
    month: string;
    monthLabel: string;
    monthStart: string;
    monthEnd: string;
    today: string;
};

type CalendarFilters = {
    month: string;
    department_id: number | null;
    leave_type: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Leave Calendar', href: '/leave-calendar' },
];

const CALENDAR_WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const LEAVE_TYPE_TONE_CLASSES = [
    'bg-blue-500/12 text-blue-700 border-blue-500/30 dark:bg-blue-500/25 dark:text-blue-200 dark:border-blue-400/40',
    'bg-violet-500/12 text-violet-700 border-violet-500/30 dark:bg-violet-500/25 dark:text-violet-200 dark:border-violet-400/40',
    'bg-amber-500/12 text-amber-700 border-amber-500/30 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/40',
    'bg-emerald-500/12 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/40',
    'bg-rose-500/12 text-rose-700 border-rose-500/30 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/40',
    'bg-cyan-500/12 text-cyan-700 border-cyan-500/30 dark:bg-cyan-500/25 dark:text-cyan-200 dark:border-cyan-400/40',
];

const KEYWORD_TONE_MAP: Array<{ keywords: string[]; tone: string }> = [
    {
        keywords: ['annual', 'vacation'],
        tone: 'bg-blue-500/12 text-blue-700 border-blue-500/30 dark:bg-blue-500/25 dark:text-blue-200 dark:border-blue-400/40',
    },
    {
        keywords: ['sick', 'medical'],
        tone: 'bg-rose-500/12 text-rose-700 border-rose-500/30 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/40',
    },
    {
        keywords: ['personal'],
        tone: 'bg-violet-500/12 text-violet-700 border-violet-500/30 dark:bg-violet-500/25 dark:text-violet-200 dark:border-violet-400/40',
    },
    {
        keywords: ['maternity', 'paternity'],
        tone: 'bg-emerald-500/12 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/40',
    },
    {
        keywords: ['emergency'],
        tone: 'bg-amber-500/12 text-amber-700 border-amber-500/30 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/40',
    },
    {
        keywords: ['unpaid'],
        tone: 'bg-slate-500/12 text-slate-700 border-slate-500/30 dark:bg-slate-500/25 dark:text-slate-200 dark:border-slate-400/40',
    },
];

function hashString(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }

    return hash;
}

function leaveTypeToneClass(leaveType: string): string {
    const normalized = leaveType.toLowerCase();
    const mappedTone = KEYWORD_TONE_MAP.find((item) =>
        item.keywords.some((keyword) => normalized.includes(keyword)),
    );
    if (mappedTone) {
        return mappedTone.tone;
    }

    const idx = hashString(leaveType) % LEAVE_TYPE_TONE_CLASSES.length;

    return LEAVE_TYPE_TONE_CLASSES[idx];
}

function toCalendarGridDates(monthStartIso: string): Date[] {
    const monthStart = new Date(`${monthStartIso}T00:00:00`);
    const firstWeekday = (monthStart.getDay() + 6) % 7;
    const start = new Date(monthStart);
    start.setDate(monthStart.getDate() - firstWeekday);

    const days: Date[] = [];
    for (let i = 0; i < 42; i += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        days.push(date);
    }

    return days;
}

function toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatDate(dateString: string): string {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatDateShort(dateString: string): string {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
    });
}

function formatDateRange(from: string, to: string): string {
    if (from === to) {
        return formatDate(from);
    }

    return `${formatDateShort(from)} - ${formatDateShort(to)}`;
}

function dayLoadTone(dayCount: number): string {
    if (dayCount >= 4) {
        return 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/20 dark:text-rose-200';
    }
    if (dayCount >= 2) {
        return 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200';
    }

    return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200';
}

function dayCardBaseTone(
    inCurrentMonth: boolean,
    isToday: boolean,
    leaveCount: number,
): string {
    if (!inCurrentMonth) {
        return 'border-slate-800/50 bg-slate-900/35 text-slate-500';
    }

    if (isToday) {
        return 'border-primary/55 bg-primary/12 dark:bg-primary/22';
    }

    if (leaveCount === 0) {
        return 'border-slate-700/70 bg-slate-900/55 text-slate-200';
    }

    if (leaveCount >= 4) {
        return 'border-rose-500/35 bg-rose-500/[0.10] dark:border-rose-400/35 dark:bg-rose-500/[0.18]';
    }

    if (leaveCount >= 2) {
        return 'border-amber-500/35 bg-amber-500/[0.10] dark:border-amber-400/35 dark:bg-amber-500/[0.18]';
    }

    return 'border-blue-500/35 bg-blue-500/[0.10] dark:border-blue-400/35 dark:bg-blue-500/[0.18]';
}

export default function LeaveCalendarIndex({
    filters,
    meta,
    departments,
    leaveTypes,
    entries,
    calendarDayCounts,
    todayOnLeave,
    upcomingLeaves,
    departmentSummary,
}: {
    filters: CalendarFilters;
    meta: CalendarMeta;
    departments: DepartmentOption[];
    leaveTypes: LeaveTypeOption[];
    entries: LeaveCalendarEntry[];
    calendarDayCounts: Record<string, number>;
    todayOnLeave: LeaveCalendarEntry[];
    upcomingLeaves: LeaveCalendarEntry[];
    departmentSummary: DepartmentSummary[];
}) {
    const [monthInput, setMonthInput] = useState(filters.month);
    const [departmentInput, setDepartmentInput] = useState(
        filters.department_id != null ? String(filters.department_id) : 'all',
    );
    const [leaveTypeInput, setLeaveTypeInput] = useState(filters.leave_type ?? 'all');

    const calendarDates = useMemo(() => toCalendarGridDates(meta.monthStart), [meta.monthStart]);

    const summaryStats = useMemo(() => {
        const employeeCount = new Set(entries.map((entry) => entry.employee_name)).size;
        const totalDays = entries.reduce((sum, entry) => sum + entry.days, 0);
        const departmentsActive = new Set(entries.map((entry) => entry.department_name)).size;

        return {
            approvedEntries: entries.length,
            uniqueEmployees: employeeCount,
            totalDays,
            activeDepartments: departmentsActive,
        };
    }, [entries]);

    const applyFilters = () => {
        const query: Record<string, string> = {};
        if (monthInput) {
            query.month = monthInput;
        }
        if (departmentInput !== 'all') {
            query.department_id = departmentInput;
        }
        if (leaveTypeInput !== 'all') {
            query.leave_type = leaveTypeInput;
        }

        router.get('/leave-calendar', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setMonthInput(meta.month);
        setDepartmentInput('all');
        setLeaveTypeInput('all');
        router.get('/leave-calendar', { month: meta.month }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Calendar" />

            <div className="flex h-full flex-1 flex-col gap-5 p-4 md:p-6">
                <section className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-sm dark:border-slate-700/70 dark:from-slate-800/90 dark:via-slate-800/45 dark:to-transparent">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                Workforce visibility
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                                Leave Calendar
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Clear approved leave view for staffing and operational planning.
                            </p>
                        </div>
                        <Link href="/leave-requests" className="text-primary text-sm font-medium">
                            Open leave requests
                        </Link>
                    </div>
                </section>

                <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">Approved entries</p>
                        <p className="mt-0.5 text-2xl font-bold">{summaryStats.approvedEntries}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">Employees on leave</p>
                        <p className="mt-0.5 text-2xl font-bold">{summaryStats.uniqueEmployees}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">Total leave days</p>
                        <p className="mt-0.5 text-2xl font-bold">{summaryStats.totalDays}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">Departments active</p>
                        <p className="mt-0.5 text-2xl font-bold">{summaryStats.activeDepartments}</p>
                    </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/65 md:p-5">
                    <div className="mb-3 flex items-center gap-2">
                        <Filter className="text-muted-foreground size-4" />
                        <h2 className="text-sm font-semibold">Filters</h2>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                        <label className="grid gap-1.5 text-sm">
                            <span className="text-muted-foreground text-xs">Month</span>
                            <input
                                type="month"
                                className="border-input focus-visible:ring-ring h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                                value={monthInput}
                                onChange={(event) => setMonthInput(event.target.value)}
                            />
                        </label>
                        <label className="grid gap-1.5 text-sm">
                            <span className="text-muted-foreground text-xs">Department</span>
                            <select
                                className="border-input focus-visible:ring-ring h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                                value={departmentInput}
                                onChange={(event) => setDepartmentInput(event.target.value)}
                            >
                                <option value="all">All departments</option>
                                {departments.map((department) => (
                                    <option key={department.id} value={department.id}>
                                        {department.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1.5 text-sm">
                            <span className="text-muted-foreground text-xs">Leave type</span>
                            <select
                                className="border-input focus-visible:ring-ring h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                                value={leaveTypeInput}
                                onChange={(event) => setLeaveTypeInput(event.target.value)}
                            >
                                <option value="all">All leave types</option>
                                {leaveTypes.map((leaveType) => (
                                    <option key={leaveType.name} value={leaveType.name}>
                                        {leaveType.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="flex items-end gap-2">
                            <button
                                type="button"
                                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                                onClick={applyFilters}
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                className="border-input inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition hover:bg-accent/60 dark:border-slate-700 dark:hover:bg-slate-800/70"
                                onClick={resetFilters}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/65 md:p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="text-muted-foreground size-4" />
                                <h2 className="text-sm font-semibold">{meta.monthLabel}</h2>
                            </div>
                            <p className="text-muted-foreground text-xs">
                                {formatDate(meta.monthStart)} - {formatDate(meta.monthEnd)}
                            </p>
                        </div>

                        <div className="mb-2 grid grid-cols-7 gap-1">
                            {CALENDAR_WEEKDAY_LABELS.map((label) => (
                                <div
                                    key={label}
                                    className="text-muted-foreground px-1 py-1 text-center text-[11px] font-medium uppercase tracking-wide dark:text-slate-300"
                                >
                                    {label}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDates.map((date) => {
                                const iso = toIsoDate(date);
                                const inCurrentMonth = iso >= meta.monthStart
                                    && iso <= meta.monthEnd;
                                const leaveCount = calendarDayCounts[iso] ?? 0;
                                const isToday = iso === meta.today;

                                return (
                                    <div
                                        key={iso}
                                        className={`min-h-16 rounded-md border px-1.5 py-1 ${dayCardBaseTone(
                                            inCurrentMonth,
                                            isToday,
                                            leaveCount,
                                        )} ${isToday ? 'ring-1 ring-primary/60' : ''}`}
                                    >
                                        <div className="text-xs font-medium">{date.getDate()}</div>
                                        {leaveCount > 0 ? (
                                            <div className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${dayLoadTone(leaveCount)}`}>
                                                {leaveCount} leave
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="text-muted-foreground font-medium">Daily load:</span>
                            <span className="inline-flex rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-blue-700 dark:text-blue-200">
                                1 leave
                            </span>
                            <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-200">
                                2-3 leaves
                            </span>
                            <span className="inline-flex rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-rose-700 dark:text-rose-200">
                                4+ leaves
                            </span>
                            <span className="inline-flex rounded-full border border-primary/45 bg-primary/12 px-2 py-0.5 text-primary dark:border-primary/55 dark:bg-primary/22">
                                Today
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/65">
                            <h3 className="mb-2 text-sm font-semibold">On Leave Today</h3>
                            <div className="space-y-2">
                                {todayOnLeave.length === 0 ? (
                                    <p className="text-muted-foreground text-xs">
                                        No one is on leave today.
                                    </p>
                                ) : (
                                    todayOnLeave.slice(0, 8).map((item) => (
                                        <div key={`today-${item.id}`} className="rounded-md border border-border px-2 py-2 dark:border-slate-700/70 dark:bg-slate-950/45">
                                            <p className="text-sm font-medium">{item.employee_name}</p>
                                            <p className="text-muted-foreground text-xs">{item.department_name}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${leaveTypeToneClass(item.leave_type)}`}>
                                                    {item.leave_type}
                                                </span>
                                                <span className="text-muted-foreground text-[11px]">
                                                    {formatDateRange(item.period_from, item.period_to)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/65">
                            <h3 className="mb-2 text-sm font-semibold">Upcoming (Next 7 Days)</h3>
                            <div className="space-y-2">
                                {upcomingLeaves.length === 0 ? (
                                    <p className="text-muted-foreground text-xs">
                                        No upcoming approved leaves in the next 7 days.
                                    </p>
                                ) : (
                                    upcomingLeaves.slice(0, 8).map((item) => (
                                        <div key={`upcoming-${item.id}`} className="rounded-md border border-border px-2 py-2 dark:border-slate-700/70 dark:bg-slate-950/45">
                                            <p className="text-sm font-medium">{item.employee_name}</p>
                                            <p className="text-muted-foreground text-xs">{item.department_name}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${leaveTypeToneClass(item.leave_type)}`}>
                                                    {item.leave_type}
                                                </span>
                                                <span className="text-muted-foreground text-[11px]">
                                                    {formatDateRange(item.period_from, item.period_to)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/65 md:p-5">
                        <div className="mb-3 flex items-center gap-2">
                            <Users className="text-muted-foreground size-4" />
                            <h3 className="text-sm font-semibold">Department Summary</h3>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-border dark:border-slate-700/70">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-left dark:bg-slate-800/75">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">Department</th>
                                        <th className="px-3 py-2 font-medium">Entries</th>
                                        <th className="px-3 py-2 font-medium">Days</th>
                                        <th className="px-3 py-2 font-medium">Employees</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departmentSummary.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                                                No leave records for selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        departmentSummary.map((row) => (
                                            <tr key={row.department_name} className="border-t border-border/70">
                                                <td className="px-3 py-2">{row.department_name}</td>
                                                <td className="px-3 py-2">{row.leave_entries}</td>
                                                <td className="px-3 py-2">{row.total_days}</td>
                                                <td className="px-3 py-2">{row.employees_on_leave}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/65 md:p-5">
                        <div className="mb-3 flex items-center gap-2">
                            <Layers3 className="text-muted-foreground size-4" />
                            <h3 className="text-sm font-semibold">Approved Leave Entries</h3>
                        </div>
                        <div className="max-h-96 overflow-auto rounded-lg border border-border dark:border-slate-700/70">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-muted/40 text-left dark:bg-slate-800/85">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">Employee</th>
                                        <th className="px-3 py-2 font-medium">Department</th>
                                        <th className="px-3 py-2 font-medium">Leave Type</th>
                                        <th className="px-3 py-2 font-medium">Category</th>
                                        <th className="px-3 py-2 font-medium">Date Range</th>
                                        <th className="px-3 py-2 font-medium">Days</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                                                No approved leaves found for this view.
                                            </td>
                                        </tr>
                                    ) : (
                                        entries.map((entry) => (
                                            <tr key={entry.id} className="border-t border-border/70">
                                                <td className="px-3 py-2 font-medium">{entry.employee_name}</td>
                                                <td className="px-3 py-2">{entry.department_name}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${leaveTypeToneClass(entry.leave_type)}`}>
                                                        {entry.leave_type}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] font-medium dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100">
                                                        {entry.leave_category === 'unpaid' ? 'Unpaid' : 'Paid'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    {formatDateRange(entry.period_from, entry.period_to)}
                                                </td>
                                                <td className="px-3 py-2">{entry.days}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

