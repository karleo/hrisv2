import { Link, router, usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';
import { Bell } from 'lucide-react';
import { Languages } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { MessageSquareText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationArrivalToastShell } from '@/components/notification-arrival-toast-shell';
import { NotificationBellListItem } from '@/components/notification-bell-list-item';
import { ThemeToggleSwitch } from '@/components/theme-toggle-switch';
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
import {
    useEmployeeMessagesHeaderSync,
    type EmployeeMessagesHeaderData,
} from '@/hooks/use-employee-messages-header-sync';
import { useNotificationListPointerGuard } from '@/hooks/use-notification-list-pointer-guard';
import { useNotificationsLiveSync } from '@/hooks/use-notifications-live-sync';
import { useI18n } from '@/lib/i18n';
import { playEmployeeMessageUnreadChime } from '@/lib/play-employee-message-unread-chime';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false);
    const [messagesMenuOpen, setMessagesMenuOpen] = useState(false);
    const notificationListRef = useNotificationListPointerGuard(
        notificationsMenuOpen,
    );
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const { t, locale } = useI18n();

    const { auth, notifications: initialNotifications, employeeMessages: initialEmployeeMessages } =
        usePage().props as {
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
            employeeMessages?: EmployeeMessagesHeaderData;
        };

    const { notifications, refreshNotifications } =
        useNotificationsLiveSync(initialNotifications);
    const employeeMessages = useEmployeeMessagesHeaderSync(initialEmployeeMessages);
    const unreadCount = notifications?.unread_count ?? 0;
    const hasUnread = unreadCount > 0;
    const messagesUnread = employeeMessages?.unread_count ?? 0;
    const hasUnreadMessages = messagesUnread > 0;

    const headerChatSoundReadyRef = useRef(false);
    const headerChatSoundPrevUnreadRef = useRef(0);

    useEffect(() => {
        if (employeeMessages === undefined) {
            return;
        }

        const unread = employeeMessages.unread_count ?? 0;

        if (!headerChatSoundReadyRef.current) {
            headerChatSoundReadyRef.current = true;
            headerChatSoundPrevUnreadRef.current = unread;

            return;
        }

        if (unread > headerChatSoundPrevUnreadRef.current) {
            queueMicrotask(() => {
                playEmployeeMessageUnreadChime();
            });
        }

        headerChatSoundPrevUnreadRef.current = unread;
    }, [employeeMessages]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.document.documentElement.lang = locale;
        window.document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }, [locale]);

    const changeLocale = (nextLocale: 'en' | 'ar') => {
        if (nextLocale === locale) {
            return;
        }

        router.post(
            '/locale',
            { locale: nextLocale },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const pageTitle =
        breadcrumbs.length > 0
            ? breadcrumbs[breadcrumbs.length - 1]?.title
            : '';

    return (
        <header className="sticky top-0 z-30 shrink-0 overflow-x-hidden border-b border-border/70 bg-background/95 px-2 shadow-sm backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 supports-[backdrop-filter]:bg-background/80 sm:px-4 md:px-6">
            <div className="flex h-14 min-w-0 items-center gap-2 sm:h-16 sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <SidebarTrigger className="-ml-1 shrink-0 text-foreground/80 hover:bg-muted hover:text-foreground" />
                    {pageTitle ? (
                        <p className="truncate text-sm font-semibold text-foreground sm:hidden">
                            {pageTitle}
                        </p>
                    ) : null}
                    <div className="hidden min-w-0 flex-1 overflow-hidden sm:block [&_[data-slot=breadcrumb-link]]:text-foreground/75 [&_[data-slot=breadcrumb-link]:hover]:text-foreground [&_[data-slot=breadcrumb-list]]:text-foreground/70 [&_[data-slot=breadcrumb-page]]:max-w-[14rem] [&_[data-slot=breadcrumb-page]]:truncate [&_[data-slot=breadcrumb-page]]:font-semibold [&_[data-slot=breadcrumb-page]]:text-foreground md:[&_[data-slot=breadcrumb-page]]:max-w-none [&_[data-slot=breadcrumb-separator]]:text-foreground/45">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-0.5 rounded-xl border border-border/70 bg-card/80 p-0.5 shadow-xs sm:gap-1.5 sm:p-1">
                    <ThemeToggleSwitch
                        resolvedAppearance={resolvedAppearance}
                        onToggle={() =>
                            updateAppearance(
                                resolvedAppearance === 'dark'
                                    ? 'light'
                                    : 'dark',
                            )
                        }
                        className="origin-center scale-[0.65] sm:scale-75"
                    />
                    <DropdownMenu
                        open={messagesMenuOpen}
                        onOpenChange={setMessagesMenuOpen}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button className="relative h-8 w-8 rounded-lg p-0 text-xs font-semibold sm:h-9 sm:w-auto sm:px-3">
                                <MessageCircle className="size-4" />
                                <span className="hidden sm:inline">Chat</span>
                                {hasUnreadMessages ? (
                                    <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-gradient-to-r from-rose-500 to-red-600 px-1 text-[11px] leading-none font-bold text-white shadow-[0_0_0_2px_rgba(255,255,255,0.6)] dark:shadow-[0_0_0_2px_rgba(15,23,42,0.8)]">
                                        {messagesUnread > 99
                                            ? '99+'
                                            : messagesUnread}
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
                                <span className="text-sm font-semibold">
                                    Unread messages
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {messagesUnread}{' '}
                                    {t('header.unread', 'unread')}
                                </span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-96 space-y-2 overflow-y-auto p-2.5">
                                {(employeeMessages?.conversations?.length ??
                                    0) === 0 ? (
                                    <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                                        No unread messages
                                    </p>
                                ) : (
                                    employeeMessages?.conversations?.map(
                                        (conversation) => (
                                            <Link
                                                key={conversation.id}
                                                href={`/employee-messages?conversation=${conversation.id}`}
                                                className="flex items-start gap-3 rounded-xl border bg-card/60 px-3 py-2.5 text-sm hover:bg-muted"
                                                onClick={() =>
                                                    setMessagesMenuOpen(false)
                                                }
                                            >
                                                <div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                    {initials(
                                                        conversation.employee
                                                            .full_name,
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="truncate font-semibold">
                                                            {
                                                                conversation
                                                                    .employee
                                                                    .full_name
                                                            }
                                                        </div>
                                                        {conversation.unread_count >
                                                        0 ? (
                                                            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                                                {
                                                                    conversation.unread_count
                                                                }
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                                        {conversation
                                                            .last_message?.body ??
                                                            'New messages'}
                                                    </div>
                                                </div>
                                            </Link>
                                        ),
                                    )
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            <div className="p-2.5">
                                <Button
                                    asChild
                                    variant="secondary"
                                    className="h-9 w-full justify-center rounded-lg"
                                >
                                    <Link href="/employee-messages">
                                        <MessageSquareText className="mr-2 size-4" />
                                        View all messages
                                    </Link>
                                </Button>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative h-8 w-8 rounded-lg border border-indigo-100/80 bg-indigo-50/70 text-indigo-600 hover:border-indigo-200 hover:bg-indigo-100 sm:h-9 sm:w-9 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
                                aria-label={t('language.switcher', 'Language')}
                            >
                                <Languages className="size-4 sm:size-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-44 rounded-lg"
                            align="end"
                        >
                            <DropdownMenuLabel>
                                {t('language.label', 'Language')}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Button
                                type="button"
                                variant={
                                    locale === 'en' ? 'secondary' : 'ghost'
                                }
                                className="h-8 w-full justify-start"
                                onClick={() => changeLocale('en')}
                            >
                                {t('language.english', 'English')}
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    locale === 'ar' ? 'secondary' : 'ghost'
                                }
                                className="h-8 w-full justify-start"
                                onClick={() => changeLocale('ar')}
                            >
                                {t('language.arabic', 'Arabic')}
                            </Button>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <NotificationArrivalToastShell
                        notifications={notifications}
                    >
                        <DropdownMenu
                            open={notificationsMenuOpen}
                            onOpenChange={setNotificationsMenuOpen}
                        >
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        'relative h-8 w-8 rounded-lg border transition-all sm:h-9 sm:w-9',
                                        hasUnread
                                            ? 'border-sky-200/80 bg-sky-50 text-sky-700 shadow-sm hover:border-sky-300 hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-200 dark:hover:bg-sky-500/25'
                                            : 'border-indigo-100/80 bg-indigo-50/70 text-indigo-600 hover:border-indigo-200 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20',
                                    )}
                                >
                                    <Bell
                                        className={cn(
                                            'size-5',
                                            hasUnread
                                                ? 'animate-pulse'
                                                : 'opacity-95',
                                        )}
                                    />
                                    {hasUnread ? (
                                        <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-gradient-to-r from-rose-500 to-red-600 px-1 text-[11px] leading-none font-bold text-white shadow-[0_0_0_2px_rgba(255,255,255,0.6)] dark:shadow-[0_0_0_2px_rgba(15,23,42,0.8)]">
                                            {unreadCount > 99
                                                ? '99+'
                                                : unreadCount}
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
                                    <span className="text-sm font-semibold">
                                        {t(
                                            'header.notifications',
                                            'Notifications',
                                        )}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {(notifications?.items?.length ?? 0) >
                                        0 ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                onClick={() => {
                                                    router.delete(
                                                        '/notifications',
                                                        {
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                            onSuccess: () => {
                                                                void refreshNotifications();
                                                            },
                                                        },
                                                    );
                                                }}
                                            >
                                                {t(
                                                    'header.clearAll',
                                                    'Clear all',
                                                )}
                                            </Button>
                                        ) : null}
                                        <span className="text-xs text-muted-foreground">
                                            {notifications?.unread_count ?? 0}{' '}
                                            {t('header.unread', 'unread')}
                                        </span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div
                                    ref={notificationListRef}
                                    className="max-h-96 space-y-2 overflow-y-auto p-2.5"
                                >
                                    {(notifications?.items?.length ?? 0) ===
                                    0 ? (
                                        <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                                            {t(
                                                'header.noNotifications',
                                                'No notifications',
                                            )}
                                        </p>
                                    ) : (
                                        notifications?.items?.map((item) => (
                                            <NotificationBellListItem
                                                key={item.id}
                                                item={item}
                                            />
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
                                className="h-8 w-8 shrink-0 rounded-lg p-0 text-foreground hover:bg-muted sm:h-9 sm:w-auto sm:max-w-[220px] sm:px-2"
                            >
                                <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-start">
                                    <div className="sm:hidden">
                                        <UserInfo user={auth.user} compact />
                                    </div>
                                    <div className="hidden min-w-0 items-center gap-2 sm:flex">
                                        <UserInfo user={auth.user} />
                                        <ChevronsUpDown className="size-4 shrink-0 opacity-70" />
                                    </div>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56 rounded-lg"
                            align="end"
                        >
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
