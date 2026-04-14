import { router, usePage, usePoll } from '@inertiajs/react';
import { Bell, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationArrivalToastShell } from '@/components/notification-arrival-toast-shell';
import { NotificationBellListItem } from '@/components/notification-bell-list-item';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { useNotificationListPointerGuard } from '@/hooks/use-notification-list-pointer-guard';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false);
    const notificationListRef = useNotificationListPointerGuard(notificationsMenuOpen);
    const { resolvedAppearance, updateAppearance } = useAppearance();

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
                    decision?: string;
                    employee_photo_url?: string | null;
                };
            }>;
        };
    };

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto flex items-center gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() =>
                        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark')
                    }
                    aria-label={
                        resolvedAppearance === 'dark'
                            ? 'Switch to light mode'
                            : 'Switch to dark mode'
                    }
                    title={
                        resolvedAppearance === 'dark'
                            ? 'Switch to light mode'
                            : 'Switch to dark mode'
                    }
                >
                    {resolvedAppearance === 'dark' ? (
                        <Sun className="size-5 opacity-80" />
                    ) : (
                        <Moon className="size-5 opacity-80" />
                    )}
                </Button>
                <NotificationArrivalToastShell notifications={notifications}>
                    <DropdownMenu
                        open={notificationsMenuOpen}
                        onOpenChange={setNotificationsMenuOpen}
                    >
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
                        <DropdownMenuContent
                        align="end"
                        className="w-[min(24rem,calc(100vw-2rem))] max-w-[min(24rem,calc(100vw-2rem))] rounded-xl p-0"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-sm font-semibold">Notifications</span>
                            <div className="flex items-center gap-2">
                                {(notifications?.items?.length ?? 0) > 0 ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                        onClick={() => {
                                            router.delete('/notifications', {
                                                preserveScroll: true,
                                                preserveState: true,
                                            });
                                        }}
                                    >
                                        Clear all
                                    </Button>
                                ) : null}
                                <span className="text-muted-foreground text-xs">
                                    {notifications?.unread_count ?? 0} unread
                                </span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div
                            ref={notificationListRef}
                            className="max-h-96 space-y-2 overflow-y-auto p-2.5"
                        >
                            {(notifications?.items?.length ?? 0) === 0 ? (
                                <p className="text-muted-foreground px-2 py-4 text-center text-sm">
                                    No notifications
                                </p>
                            ) : (
                                notifications?.items?.map((item) => (
                                    <NotificationBellListItem key={item.id} item={item} />
                                ))
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
                </NotificationArrivalToastShell>
            </div>
        </header>
    );
}
