import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: string;
};

export type NavItem = {
    title: string;
    description?: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    /** Permission module key (e.g. `employees`); if set, `can_access` must be true to show the item. */
    module?: string;
    items?: NavItem[];
};
