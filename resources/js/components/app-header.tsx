import { Link, router, usePage, usePoll } from '@inertiajs/react';
import { Bell, BookOpen, Folder, LayoutGrid, Menu, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationArrivalToastShell } from '@/components/notification-arrival-toast-shell';
import { NotificationBellListItem } from '@/components/notification-bell-list-item';
import { ThemeToggleSwitch } from '@/components/theme-toggle-switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { getFirstNameLetter } from '@/hooks/use-initials';
import { useAppearance } from '@/hooks/use-appearance';
import { useNotificationListPointerGuard } from '@/hooks/use-notification-list-pointer-guard';
import { filterNavByModuleAccess } from '@/lib/nav-permissions';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, NavItem } from '@/types';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const mainNavItemsSource: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        module: 'dashboard',
    },
];

const rightNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

const activeItemStyles =
    'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

export function AppHeader({ breadcrumbs = [] }: Props) {
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

    const page = usePage();
    const { auth, modulePermissions, notifications } = page.props as typeof page.props & {
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

    const mainNavItems = useMemo(
        () => filterNavByModuleAccess(mainNavItemsSource, modulePermissions),
        [modulePermissions],
    );
    const unreadCount = notifications?.unread_count ?? 0;
    const hasUnread = unreadCount > 0;
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();
    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 h-[34px] w-[34px]"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar"
                            >
                                <SheetTitle className="sr-only">
                                    Navigation Menu
                                </SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {mainNavItems.map((item) => (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && (
                                                        <item.icon className="h-5 w-5" />
                                                    )}
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="flex flex-col space-y-4">
                                            {rightNavItems.map((item) => (
                                                <a
                                                    key={item.title}
                                                    href={toUrl(item.href)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && (
                                                        <item.icon className="h-5 w-5" />
                                                    )}
                                                    <span>{item.title}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href={dashboard()}
                        prefetch
                        className="flex items-center space-x-2"
                    >
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
                        <NavigationMenu className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch space-x-2">
                                {mainNavItems.map((item, index) => (
                                    <NavigationMenuItem
                                        key={index}
                                        className="relative flex h-full items-center"
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                whenCurrentUrl(
                                                    item.href,
                                                    activeItemStyles,
                                                ),
                                                'h-9 cursor-pointer px-3',
                                            )}
                                        >
                                            {item.icon && (
                                                <item.icon className="mr-2 h-4 w-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                        {isCurrentUrl(item.href) && (
                                            <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex items-center space-x-2">
                        <ThemeToggleSwitch
                            resolvedAppearance={resolvedAppearance}
                            onToggle={() =>
                                updateAppearance(
                                    resolvedAppearance === 'dark' ? 'light' : 'dark'
                                )
                            }
                            className="origin-center scale-75"
                        />
                        <NotificationArrivalToastShell notifications={notifications}>
                            <DropdownMenu
                                open={notificationsMenuOpen}
                                onOpenChange={setNotificationsMenuOpen}
                            >
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            'relative h-9 w-9 rounded-lg border transition-all',
                                            hasUnread
                                                ? 'border-sky-200/80 bg-sky-50 text-sky-700 shadow-sm hover:border-sky-300 hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-200 dark:hover:bg-sky-500/25'
                                                : 'border-indigo-100/80 bg-indigo-50/70 text-indigo-600 hover:border-indigo-200 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20',
                                        )}
                                    >
                                        <Bell
                                            className={cn(
                                                'size-5',
                                                hasUnread ? 'animate-pulse' : 'opacity-95',
                                            )}
                                        />
                                        {hasUnread ? (
                                            <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-gradient-to-r from-rose-500 to-red-600 px-1 text-[11px] leading-none font-bold text-white shadow-[0_0_0_2px_rgba(255,255,255,0.6)] dark:shadow-[0_0_0_2px_rgba(15,23,42,0.8)]">
                                                {unreadCount > 99 ? '99+' : unreadCount}
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
                        <div className="relative flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="group h-9 w-9 cursor-pointer"
                            >
                                <Search className="!size-5 opacity-80 group-hover:opacity-100" />
                            </Button>
                            <div className="ml-1 hidden gap-1 lg:flex">
                                {rightNavItems.map((item) => (
                                    <TooltipProvider
                                        key={item.title}
                                        delayDuration={0}
                                    >
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <a
                                                    href={toUrl(item.href)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group inline-flex h-9 w-9 items-center justify-center rounded-md bg-transparent p-0 text-sm font-medium text-accent-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    <span className="sr-only">
                                                        {item.title}
                                                    </span>
                                                    {item.icon && (
                                                        <item.icon className="size-5 opacity-80 group-hover:opacity-100" />
                                                    )}
                                                </a>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{item.title}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-10 rounded-full p-1"
                                >
                                    <Avatar className="size-8 overflow-hidden rounded-full">
                                        <AvatarImage
                                            src={auth.user.avatar ?? undefined}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getFirstNameLetter(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
