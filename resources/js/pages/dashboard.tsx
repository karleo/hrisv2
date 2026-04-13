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

export default function Dashboard({
    pending,
    recentPending,
}: {
    pending: PendingSummary;
    recentPending: RecentPending;
}) {
    useRequestStatusPoll(['pending', 'recentPending']);

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

    const totalPending = cards.reduce((sum, card) => sum + card.value, 0);
    const busiestQueue = cards.reduce((top, card) =>
        card.value > top.value ? card : top,
    cards[0]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <section className="rounded-2xl border border-border bg-gradient-to-r from-primary/12 via-primary/5 to-transparent p-5 shadow-sm dark:from-primary/22 dark:via-primary/10 dark:to-transparent">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                Approval workspace
                            </p>
                            <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
                                Pending requests overview
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                All queues are personalized by your role and department access.
                            </p>
                        </div>
                        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
                            <div className="rounded-xl border border-border bg-card/90 px-4 py-3 backdrop-blur-sm">
                                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                    Total pending
                                </p>
                                <p className="mt-0.5 text-2xl font-bold">{totalPending}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-card/90 px-4 py-3 backdrop-blur-sm">
                                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                    Busiest queue
                                </p>
                                <p className="mt-0.5 text-sm font-semibold">{busiestQueue.title}</p>
                                <p className="text-muted-foreground text-xs">{busiestQueue.value} pending</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                        <Link
                            key={card.title}
                            href={card.href}
                            className={`group rounded-2xl border bg-gradient-to-br p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${card.tone}`}
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <div className="rounded-lg border border-border bg-card/80 p-2 text-foreground backdrop-blur-sm">
                                    <card.icon className="size-4.5" />
                                </div>
                                <ArrowRight className="text-muted-foreground size-4 transition group-hover:translate-x-0.5" />
                            </div>
                            <p className="text-sm font-medium">{card.title}</p>
                            <p className="mt-1 text-3xl leading-none font-bold tabular-nums">{card.value}</p>
                            <p className="text-muted-foreground mt-2 text-xs">{card.summary}</p>
                        </Link>
                    ))}
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    {cards.map((card) => (
                        <div
                            key={`${card.title}-list`}
                            className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5"
                        >
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <card.icon className="text-muted-foreground size-4" />
                                    <h3 className="text-sm font-semibold md:text-base">{card.title}</h3>
                                </div>
                                <Link href={card.href} className="text-primary text-sm font-medium">
                                    View all
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {card.items.length === 0 ? (
                                    <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm">
                                        <CircleCheckBig className="size-4" />
                                        <span>No pending requests</span>
                                    </div>
                                ) : (
                                    card.items.map((item) => (
                                        <Link
                                            key={`${card.title}-${item.id}`}
                                            href={card.itemHref(item.id)}
                                            className="hover:bg-accent/60 block rounded-lg border border-border px-3 py-2.5 transition"
                                        >
                                            <p className="text-sm font-semibold tracking-wide">{item.code}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {item.employee || 'Employee'}
                                            </p>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        </AppLayout>
    );
}
