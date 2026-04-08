import { Link, router, usePage, usePoll } from '@inertiajs/react';
import { Bell, BookOpen, Folder, LayoutGrid, Menu, Search, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
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
import { useInitials } from '@/hooks/use-initials';
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

    const mainNavItems = useMemo(
        () => filterNavByModuleAccess(mainNavItemsSource, modulePermissions),
        [modulePermissions],
    );
    const getInitials = useInitials();
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
                                            src={auth.user.avatar}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(auth.user.name)}
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
