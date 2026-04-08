import { router, usePage, usePoll } from '@inertiajs/react';
import { Bell, Trash2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    usePoll(
        10000,
        {
            only: ['notifications'],
            preserveScroll: true,
            preserveState: true,
        },
        { keepAlive: true },
    );

    const { notifications } = usePage().props as {
        notifications?: {
            unread_count: number;
            items: Array<{
                id: string;
                read_at?: string | null;
                data?: {
                    request_code?: string;
                    request_type?: string;
                    request_date?: string;
                    route?: string;
                    request_id?: number;
                };
            }>;
        };
    };

    const notificationHref = (item: {
        data?: {
            request_type?: string;
            request_date?: string;
            request_id?: number;
            route?: string;
        };
    }): string => {
        const direct = item.data?.route;
        if (direct) return direct;

        const requestId = item.data?.request_id;
        if (!requestId) return '#';

        switch (item.data?.request_type) {
            case 'leave_request':
                return `/leave-requests/${requestId}`;
            case 'employee_request':
                return `/employee-requests/${requestId}`;
            case 'it_request':
                return `/it-requests/${requestId}`;
            case 'it_asset_request':
                return `/it-asset-requests/${requestId}`;
            default:
                return '#';
        }
    };

    const formatRequestDate = (value?: string): string => {
        if (!value) return '';
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!match) return value;
        const [, y, m, d] = match;
        return `${d}/${m}/${y}`;
    };

    const formatRequestType = (value?: string): string => {
        if (!value) return 'Request';
        const labels: Record<string, string> = {
            leave_request: 'Leave Request Form',
            employee_request: 'Employee Request Form',
            it_request: 'IT Request Form',
            it_asset_request: 'IT Asset Request Form',
        };
        return labels[value] ?? 'Request Form';
    };

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative h-9 w-9">
                            <Bell className="size-5 opacity-80" />
                            {(notifications?.unread_count ?? 0) > 0 ? (
                                <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-red-600 px-1 text-[11px] leading-none font-bold text-white">
                                    {(notifications?.unread_count ?? 0) > 99
                                        ? '99+'
                                        : notifications?.unread_count}
                                </span>
                            ) : null}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-96 rounded-xl p-0">
                        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-sm font-semibold">Notifications</span>
                            <span className="text-muted-foreground text-xs">
                                {notifications?.unread_count ?? 0} unread
                            </span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="max-h-96 space-y-1.5 overflow-y-auto p-2.5">
                            {(notifications?.items?.length ?? 0) === 0 ? (
                                <p className="text-muted-foreground px-2 py-4 text-center text-sm">
                                    No notifications
                                </p>
                            ) : (
                                notifications?.items?.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${!item.read_at ? 'border-primary/30 bg-primary/[0.07]' : 'border-border/60 bg-background hover:bg-accent/40'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const href = notificationHref(item);
                                                    router.post(
                                                        `/notifications/${item.id}/read`,
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                            onSuccess: () => {
                                                                if (href !== '#') {
                                                                    router.visit(href);
                                                                }
                                                            },
                                                        }
                                                    );
                                                }}
                                                className="min-w-0 flex-1 text-left"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="truncate font-semibold">
                                                        {item.data?.request_code ?? 'Request submitted'}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground text-xs">
                                                            {formatRequestDate(
                                                                item.data?.request_date ??
                                                                    item.created_at ??
                                                                    undefined
                                                            )}
                                                        </span>
                                                        {!item.read_at ? (
                                                            <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                                                NEW
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                    {formatRequestType(item.data?.request_type)}
                                                    {' • '}
                                                    Tap to open request
                                                </p>
                                            </button>
                                            {item.read_at ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => {
                                                        router.delete(`/notifications/${item.id}`, {
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                        });
                                                    }}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
