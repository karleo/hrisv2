import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
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
                        className="h-8 rounded-lg border border-white/40 bg-white/35 px-2 text-xs font-medium backdrop-blur-sm transition-all hover:border-primary/45 hover:bg-primary/10 hover:text-primary dark:border-white/18 dark:bg-white/14 data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                        <Link href={item.href ?? '#'} prefetch>
                            {item.icon && <item.icon />}
                            <span className="min-w-0 flex-1 whitespace-nowrap">
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
                            className="h-8 rounded-lg border border-white/40 bg-white/35 px-2 text-xs font-medium backdrop-blur-sm transition-all hover:border-primary/45 hover:bg-primary/10 hover:text-primary dark:border-white/18 dark:bg-white/14 data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                        >
                            {item.icon && <item.icon />}
                            <span className="min-w-0 flex-1 whitespace-nowrap">
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
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu className="gap-2">
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
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={{ children: item.title }}
                                            isActive={isAnyChildActive}
                                            className="h-auto min-h-11 overflow-visible rounded-xl border border-white/45 bg-white/30 px-2.5 py-1.5 text-[13px] backdrop-blur-sm transition-all hover:border-primary/45 hover:bg-primary/10 hover:text-primary dark:border-white/18 dark:bg-white/14 data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                                        >
                                            {item.icon && <item.icon className="mt-0.5 size-4.5" />}
                                            <div className="flex min-w-0 flex-1 items-center">
                                                <span className="font-medium whitespace-normal break-words leading-tight">
                                                    {item.title}
                                                </span>
                                            </div>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
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

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={!!item.href && isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                                className="h-auto min-h-11 overflow-visible rounded-xl border border-white/45 bg-white/30 px-2.5 py-1.5 text-[13px] backdrop-blur-sm transition-all hover:border-primary/45 hover:bg-primary/10 hover:text-primary dark:border-white/18 dark:bg-white/14 data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                            >
                                <Link href={item.href ?? '#'} prefetch>
                                    {item.icon && <item.icon className="mt-0.5 size-4.5" />}
                                    <div className="flex min-w-0 flex-1 items-center">
                                        <span className="font-medium whitespace-normal break-words leading-tight">
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
