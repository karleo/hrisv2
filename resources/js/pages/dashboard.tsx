import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Briefcase, CalendarDays, CircleCheckBig, Monitor, Package } from 'lucide-react';
import { useRequestStatusPoll } from '@/hooks/use-request-status-poll';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type PendingSummary = {
    leave_requests: number;
    employee_requests: number;
    it_requests: number;
    it_asset_requests: number;
};

type PendingItem = {
    id: number;
    code: string;
    employee: string;
};

type RecentPending = {
    leave_requests: PendingItem[];
    employee_requests: PendingItem[];
    it_requests: PendingItem[];
    it_asset_requests: PendingItem[];
};

type DashboardCard = {
    title: string;
    value: number;
    href: string;
    items: PendingItem[];
    itemHref: (id: number) => string;
    icon: typeof CalendarDays;
    tone: string;
    summary: string;
};

type LeaveCalendarEntry = {
    id: number;
    employee_name: string;
    department_name: string;
    leave_type: string;
    leave_category: 'paid' | 'unpaid' | string;
    period_from: string;
    period_to: string;
};

type LeaveCalendarWidget = {
    monthLabel: string;
    monthStart: string;
    monthEnd: string;
    today: string;
    calendarDayCounts: Record<string, number>;
    todayOnLeave: LeaveCalendarEntry[];
    upcomingLeaves: LeaveCalendarEntry[];
    departmentsCount: number;
};

const CALENDAR_WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LEAVE_TYPE_TONE_CLASSES = [
    'bg-blue-500/12 text-blue-700 border-blue-500/30 dark:bg-blue-500/25 dark:text-blue-200 dark:border-blue-400/40',
    'bg-violet-500/12 text-violet-700 border-violet-500/30 dark:bg-violet-500/25 dark:text-violet-200 dark:border-violet-400/40',
    'bg-amber-500/12 text-amber-700 border-amber-500/30 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/40',
    'bg-emerald-500/12 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/40',
    'bg-rose-500/12 text-rose-700 border-rose-500/30 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/40',
    'bg-cyan-500/12 text-cyan-700 border-cyan-500/30 dark:bg-cyan-500/25 dark:text-cyan-200 dark:border-cyan-400/40',
];

function hashString(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }

    return hash;
}

function leaveTypeToneClass(leaveType: string): string {
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

export default function Dashboard({
    pending,
    recentPending,
    leaveCalendarWidget,
    canViewLeaveCalendar,
}: {
    pending: PendingSummary;
    recentPending: RecentPending;
    leaveCalendarWidget: LeaveCalendarWidget | null;
    canViewLeaveCalendar: boolean;
}) {
    useRequestStatusPoll(['pending', 'recentPending', 'leaveCalendarWidget']);

    const cards: DashboardCard[] = [
        {
            title: 'Leave Requests',
            value: pending.leave_requests,
            href: '/leave-requests',
            items: recentPending.leave_requests,
            itemHref: (id: number) => `/leave-requests/${id}`,
            icon: CalendarDays,
            tone: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 dark:from-blue-500/25 dark:to-cyan-500/18 dark:border-blue-400/40',
            summary: 'Time-off approvals',
        },
        {
            title: 'Employee Requests',
            value: pending.employee_requests,
            href: '/employee-requests',
            items: recentPending.employee_requests,
            itemHref: (id: number) => `/employee-requests/${id}`,
            icon: Briefcase,
            tone: 'from-violet-500/10 to-indigo-500/10 border-violet-500/20 dark:from-violet-500/25 dark:to-indigo-500/18 dark:border-violet-400/40',
            summary: 'HR operational requests',
        },
        {
            title: 'IT Requests',
            value: pending.it_requests,
            href: '/it-requests',
            items: recentPending.it_requests,
            itemHref: (id: number) => `/it-requests/${id}`,
            icon: Monitor,
            tone: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 dark:from-amber-500/25 dark:to-orange-500/18 dark:border-amber-400/40',
            summary: 'Support and service tickets',
        },
        {
            title: 'IT Asset Requests',
            value: pending.it_asset_requests,
            href: '/it-asset-requests',
            items: recentPending.it_asset_requests,
            itemHref: (id: number) => `/it-asset-requests/${id}`,
            icon: Package,
            tone: 'from-emerald-500/10 to-green-500/10 border-emerald-500/20 dark:from-emerald-500/25 dark:to-green-500/18 dark:border-emerald-400/40',
            summary: 'Hardware and asset approvals',
        },
    ];

    const calendarDates = leaveCalendarWidget
        ? toCalendarGridDates(leaveCalendarWidget.monthStart)
        : [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <section className="rounded-2xl border border-border bg-gradient-to-r from-primary/12 via-primary/5 to-transparent p-5 shadow-sm dark:from-primary/22 dark:via-primary/10 dark:to-transparent">
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                Approval workspace
                            </p>
                            <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
                                Pending requests overview
                            </h1>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                        <div
                            key={card.title}
                            className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${card.tone}`}
                        >
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="rounded-lg border border-border bg-card/80 p-2 text-foreground backdrop-blur-sm">
                                    <card.icon className="size-4.5" />
                                </div>
                                <Link
                                    href={card.href}
                                    className="text-primary inline-flex items-center gap-1 text-xs font-medium"
                                >
                                    View all
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </div>
                            <p className="text-sm font-medium">{card.title}</p>
                            <p className="mt-1 text-3xl leading-none font-bold tabular-nums">{card.value}</p>
                            <p className="text-muted-foreground mt-2 text-xs">{card.summary}</p>
                            <div className="mt-4 space-y-2">
                                {card.items.length === 0 ? (
                                    <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed border-border bg-card/70 px-3 py-2.5 text-xs">
                                        <CircleCheckBig className="size-3.5" />
                                        <span>No pending requests</span>
                                    </div>
                                ) : (
                                    card.items.slice(0, 2).map((item) => (
                                        <Link
                                            key={`${card.title}-${item.id}`}
                                            href={card.itemHref(item.id)}
                                            className="hover:bg-accent/60 block rounded-lg border border-border bg-card/70 px-3 py-2 transition"
                                        >
                                            <p className="text-xs font-semibold tracking-wide">{item.code}</p>
                                            <p className="text-muted-foreground mt-0.5 text-[11px]">
                                                {item.employee || 'Employee'}
                                            </p>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </section>

                {canViewLeaveCalendar && leaveCalendarWidget ? (
                    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold">Leave Calendar</h3>
                                <p className="text-muted-foreground text-sm">
                                    {leaveCalendarWidget.monthLabel} operational leave snapshot
                                </p>
                            </div>
                            <Link
                                href="/leave-calendar"
                                className="text-primary text-sm font-medium"
                            >
                                Open detailed calendar
                            </Link>
                        </div>

                        <div className="mb-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                    On leave today
                                </p>
                                <p className="mt-0.5 text-2xl font-bold">
                                    {leaveCalendarWidget.todayOnLeave.length}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                    Upcoming (7 days)
                                </p>
                                <p className="mt-0.5 text-2xl font-bold">
                                    {leaveCalendarWidget.upcomingLeaves.length}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                    Departments in scope
                                </p>
                                <p className="mt-0.5 text-2xl font-bold">
                                    {leaveCalendarWidget.departmentsCount}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                            <div className="rounded-xl border border-border p-3">
                                <div className="mb-2 grid grid-cols-7 gap-1">
                                    {CALENDAR_WEEKDAY_LABELS.map((label) => (
                                        <div
                                            key={label}
                                            className="text-muted-foreground px-1 py-1 text-center text-[11px] font-medium uppercase tracking-wide"
                                        >
                                            {label}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDates.map((date) => {
                                        const iso = toIsoDate(date);
                                        const inCurrentMonth = iso >= leaveCalendarWidget.monthStart
                                            && iso <= leaveCalendarWidget.monthEnd;
                                        const leaveCount = leaveCalendarWidget.calendarDayCounts[iso] ?? 0;
                                        const isToday = iso === leaveCalendarWidget.today;

                                        return (
                                            <div
                                                key={iso}
                                                className={`min-h-14 rounded-md border px-1.5 py-1 ${
                                                    inCurrentMonth
                                                        ? 'border-border bg-background'
                                                        : 'border-transparent bg-muted/20 text-muted-foreground'
                                                } ${isToday ? 'ring-1 ring-primary/60' : ''}`}
                                            >
                                                <div className="text-xs font-medium">
                                                    {date.getDate()}
                                                </div>
                                                {leaveCount > 0 ? (
                                                    <div className="mt-1 inline-flex rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                                        {leaveCount} leave
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-xl border border-border p-3">
                                    <p className="mb-2 text-sm font-semibold">Today</p>
                                    <div className="space-y-2">
                                        {leaveCalendarWidget.todayOnLeave.length === 0 ? (
                                            <p className="text-muted-foreground text-xs">
                                                No employees on leave today.
                                            </p>
                                        ) : (
                                            leaveCalendarWidget.todayOnLeave.slice(0, 5).map((item) => (
                                                <div key={`today-${item.id}`} className="rounded-md border border-border px-2 py-2">
                                                    <p className="text-sm font-medium">{item.employee_name}</p>
                                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${leaveTypeToneClass(item.leave_type)}`}>
                                                            {item.leave_type}
                                                        </span>
                                                        <span className="text-muted-foreground text-[11px]">
                                                            {item.period_from} - {item.period_to}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-border p-3">
                                    <p className="mb-2 text-sm font-semibold">Upcoming</p>
                                    <div className="space-y-2">
                                        {leaveCalendarWidget.upcomingLeaves.length === 0 ? (
                                            <p className="text-muted-foreground text-xs">
                                                No upcoming approved leaves in next 7 days.
                                            </p>
                                        ) : (
                                            leaveCalendarWidget.upcomingLeaves.slice(0, 5).map((item) => (
                                                <div key={`upcoming-${item.id}`} className="rounded-md border border-border px-2 py-2">
                                                    <p className="text-sm font-medium">{item.employee_name}</p>
                                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${leaveTypeToneClass(item.leave_type)}`}>
                                                            {item.leave_type}
                                                        </span>
                                                        <span className="text-muted-foreground text-[11px]">
                                                            {item.period_from} - {item.period_to}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : null}
            </div>
        </AppLayout>
    );
}
