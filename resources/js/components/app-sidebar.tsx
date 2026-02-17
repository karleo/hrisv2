import { Link } from '@inertiajs/react';
import {
    AppWindow,
    BookOpen,
    Building2,
    Briefcase,
    CalendarDays,
    Cpu,
    Folder,
    Globe,
    LayoutGrid,
    Users,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as countriesIndex } from '@/routes/countries';
import { index as departmentsIndex } from '@/routes/departments';
import { index as employeesIndex } from '@/routes/employees';
import { index as hardwareIndex } from '@/routes/hardware';
import { index as itRequestsIndex } from '@/routes/it-requests';
import { index as jobPositionsIndex } from '@/routes/job-positions';
import { index as leaveRequestsIndex } from '@/routes/leave-requests';
import { index as leaveTypesIndex } from '@/routes/leave-types';
import { index as softwareIndex } from '@/routes/software';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Employees',
        href: employeesIndex(),
        icon: Users,
    },
    {
        title: 'Departments',
        href: departmentsIndex(),
        icon: Building2,
    },
    {
        title: 'Job Positions',
        href: jobPositionsIndex(),
        icon: Briefcase,
    },
    {
        title: 'Leave Types',
        href: leaveTypesIndex(),
        icon: CalendarDays,
    },
    {
        title: 'Leave Requests',
        href: leaveRequestsIndex(),
        icon: CalendarDays,
    },
    {
        title: 'IT Requests',
        href: itRequestsIndex(),
        icon: Cpu,
    },
    {
        title: 'Employee Requests',
        href: '/employee-requests',
        icon: Briefcase,
    },
    {
        title: 'Countries',
        href: countriesIndex(),
        icon: Globe,
    },
    {
        title: 'Software',
        href: softwareIndex(),
        icon: AppWindow,
    },
    {
        title: 'Hardware',
        href: hardwareIndex(),
        icon: Cpu,
    },
];

const footerNavItems: NavItem[] = [
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

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
