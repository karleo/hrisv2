import { Link, usePage } from '@inertiajs/react';
import {
    AppWindow,
    Briefcase,
    Building2,
    CalendarDays,
    Cpu,
    Globe,
    LayoutGrid,
    Settings,
    Shield,
    UserCog,
    UserRound,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';
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
import { filterNavByModuleAccess } from '@/lib/nav-permissions';
import { dashboard } from '@/routes';
import { index as companyProfilesIndex } from '@/routes/company-profiles';
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

const mainNavItemsSource: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        module: 'dashboard',
    },
    {
        title: 'Employees',
        href: employeesIndex(),
        icon: Users,
        module: 'employees',
    },
    {
        title: 'Leave Management',
        href: leaveRequestsIndex(),
        icon: CalendarDays,
        module: 'leave_requests',
    },
    {
        title: 'IT Requests',
        href: itRequestsIndex(),
        icon: Cpu,
        module: 'it_requests',
    },
    {
        title: 'IT Asset Management',
        href: '/it-asset-requests',
        icon: Cpu,
        module: 'it_asset_requests',
    },
    {
        title: 'Employee Requests',
        href: '/employee-requests',
        icon: Briefcase,
        module: 'employee_requests',
    },
    {
        title: 'Settings',
        icon: Settings,
        items: [
            {
                title: 'Departments',
                href: departmentsIndex(),
                icon: Building2,
                module: 'departments',
            },
            {
                title: 'Job Positions',
                href: jobPositionsIndex(),
                icon: Briefcase,
                module: 'job_positions',
            },
            {
                title: 'Countries',
                href: countriesIndex(),
                icon: Globe,
                module: 'countries',
            },
            {
                title: 'Company Profiles',
                href: companyProfilesIndex(),
                icon: Building2,
                module: 'company_profiles',
            },
            {
                title: 'Software',
                href: softwareIndex(),
                icon: AppWindow,
                module: 'software',
            },
            {
                title: 'Hardware',
                href: hardwareIndex(),
                icon: Cpu,
                module: 'hardware',
            },
            {
                title: 'Leave Types',
                href: leaveTypesIndex(),
                icon: CalendarDays,
                module: 'leave_types',
            },
            {
                title: 'Users',
                href: '/users',
                icon: UserRound,
                module: 'user_management',
            },
            {
                title: 'Roles',
                href: '/roles',
                icon: Shield,
                module: 'role_management',
            },
            {
                title: 'User roles',
                href: '/user-roles',
                icon: UserCog,
                module: 'role_management',
            },
        ],
    },
];

export function AppSidebar() {
    const { modulePermissions } = usePage().props;

    const mainNavItems = useMemo(
        () => filterNavByModuleAccess(mainNavItemsSource, modulePermissions),
        [modulePermissions],
    );

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
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
