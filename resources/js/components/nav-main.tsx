import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { isMobile, setOpenMobile } = useSidebar();
    const cleanupMobileNavigation = useMobileNavigation();

    const handleNavigate = (): void => {
        cleanupMobileNavigation();

        if (isMobile) {
            setOpenMobile(false);
        }
    };
    const hasActiveDescendant = (item: NavItem): boolean => {
        if (item.href && isCurrentUrl(item.href)) {
            return true;
        }

        if (!item.items?.length) {
            return false;
        }

        return item.items.some((child) => hasActiveDescendant(child));
    };

    const renderSubItem = (item: NavItem) => {
        const hasChildren = (item.items?.length ?? 0) > 0;
        const isActive = hasActiveDescendant(item);

        if (!hasChildren) {
            return (
                <SidebarMenuSubItem key={item.title}>
                    <SidebarMenuSubButton
                        asChild
                        isActive={isActive}
                        className="h-8 rounded-full border border-transparent bg-transparent px-3 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/45 hover:text-sidebar-accent-foreground data-[active=true]:bg-[#1b2046] data-[active=true]:font-semibold data-[active=true]:text-white"
                    >
                        <Link href={item.href ?? '#'} prefetch onClick={handleNavigate}>
                            {item.icon && <item.icon />}
                            <span className="min-w-0 flex-1 truncate">
                                {item.title}
                            </span>
                        </Link>
                    </SidebarMenuSubButton>
                </SidebarMenuSubItem>
            );
        }

        return (
            <Collapsible key={item.title} defaultOpen={isActive} className="group/collapsible-sub">
                <SidebarMenuSubItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuSubButton
                            isActive={isActive}
                            className="h-8 rounded-full border border-transparent bg-transparent px-3 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/45 hover:text-sidebar-accent-foreground data-[active=true]:bg-[#1b2046] data-[active=true]:font-semibold data-[active=true]:text-white"
                        >
                            {item.icon && <item.icon />}
                            <span className="min-w-0 flex-1 truncate">
                                {item.title}
                            </span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible-sub:rotate-90" />
                        </SidebarMenuSubButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub className="mt-2 space-y-1 pl-2">
                            {item.items!.map((child) => renderSubItem(child))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuSubItem>
            </Collapsible>
        );
    };

    return (
        <SidebarGroup className="px-1.5 py-0.5">
            <SidebarMenu className="gap-1.5">
                {items.map((item) => {
                    const hasChildren = (item.items?.length ?? 0) > 0;

                    if (hasChildren) {
                        const isAnyChildActive = hasActiveDescendant(item);

                        return (
                            <Collapsible
                                key={item.title}
                                defaultOpen={isAnyChildActive}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem
                                    className={cn(
                                        'rounded-2xl',
                                    )}
                                >
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={{ children: item.title }}
                                            isActive={isAnyChildActive}
                                            className={cn(
                                                'relative z-10 min-h-11 overflow-visible rounded-2xl border border-transparent bg-transparent px-3 py-1.5 text-[13px] text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent/45 hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:min-h-8 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0',
                                                isAnyChildActive &&
                                                    'mr-[-6px] rounded-l-[999px] rounded-r-none bg-[#1b2046] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-[#1b2046] hover:text-white',
                                            )}
                                        >
                                            {item.icon ? (
                                                <span className="flex size-6 shrink-0 items-center justify-center text-sidebar-foreground/90 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-7">
                                                    <item.icon className="size-4.5 group-data-[collapsible=icon]:size-4" />
                                                </span>
                                            ) : null}
                                            <div className="flex min-w-0 flex-1 items-center group-data-[collapsible=icon]:hidden">
                                                <span className="line-clamp-1 text-sm font-medium leading-tight">
                                                    {item.title}
                                                </span>
                                            </div>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <SidebarMenuSub className="mt-2 space-y-1">
                                            {item.items!.map((child) => renderSubItem(child))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    }

                    const isItemActive = !!item.href && isCurrentUrl(item.href);

                    return (
                        <SidebarMenuItem
                            key={item.title}
                            className={cn(
                                'mr-[-6px] rounded-2xl',
                                isItemActive &&
                                    "relative rounded-l-[999px] rounded-r-none bg-[#1b2046] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] before:pointer-events-none before:absolute before:-top-3 before:-right-3 before:size-6 before:rounded-full before:bg-[#2b2f66] before:content-[''] after:pointer-events-none after:absolute after:-bottom-3 after:-right-3 after:size-6 after:rounded-full after:bg-[#2b2f66] after:content-['']",
                            )}
                        >
                            <SidebarMenuButton
                                asChild
                                isActive={isItemActive}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    'relative z-10 min-h-11 overflow-visible rounded-2xl border border-transparent bg-transparent px-3 py-1.5 text-[13px] text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent/45 hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:min-h-8 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0',
                                    isItemActive && 'font-semibold text-white hover:bg-transparent hover:text-white',
                                )}
                            >
                                <Link href={item.href ?? '#'} prefetch onClick={handleNavigate}>
                                    {item.icon ? (
                                        <span className="flex size-6 shrink-0 items-center justify-center text-sidebar-foreground/90 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-7">
                                            <item.icon className="size-4.5 group-data-[collapsible=icon]:size-4" />
                                        </span>
                                    ) : null}
                                    <div className="flex min-w-0 flex-1 items-center group-data-[collapsible=icon]:hidden">
                                        <span className="line-clamp-1 text-sm font-medium leading-tight">
                                            {item.title}
                                        </span>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
