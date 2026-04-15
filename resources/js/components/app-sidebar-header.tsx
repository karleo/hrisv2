import { router, usePage, usePoll } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';
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
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
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

    const { notifications, auth } = usePage().props as {
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
        auth: {
            user: {
                id: number;
                name: string;
                email: string;
                avatar?: string | null;
            };
        };
    };

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border bg-sidebar px-6 text-sidebar-foreground transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1 text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
                <div className="[&_[data-slot=breadcrumb-list]]:text-sidebar-foreground/80 [&_[data-slot=breadcrumb-link]]:text-sidebar-foreground/85 [&_[data-slot=breadcrumb-link]:hover]:text-sidebar-foreground [&_[data-slot=breadcrumb-page]]:font-medium [&_[data-slot=breadcrumb-page]]:text-sidebar-foreground [&_[data-slot=breadcrumb-separator]]:text-sidebar-foreground/70">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
            <div className="ml-auto flex items-center gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative h-9 w-9 text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            >
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-9 max-w-[220px] rounded-xl px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <UserInfo user={auth.user} />
                                <ChevronsUpDown className="size-4 shrink-0 opacity-70" />
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-lg" align="end">
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
