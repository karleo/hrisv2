import { Link, usePage } from '@inertiajs/react';
import {
    AppWindow,
    Briefcase,
    Building2,
    CalendarDays,
    Clock,
    Cpu,
    Globe,
    LayoutGrid,
    Settings,
    Shield,
    Table2,
    UserCog,
    UserRound,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';
import { index as workTimetablesIndex } from '@/actions/App/Http/Controllers/WorkTimetableController';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
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
        description: 'Overview and quick metrics',
        href: dashboard(),
        icon: LayoutGrid,
        module: 'dashboard',
    },
    {
        title: 'Employees',
        description: 'Manage employee records',
        href: employeesIndex(),
        icon: Users,
        module: 'employees',
    },
    {
        title: 'Leave Management',
        description: 'Requests, approvals, and balances',
        href: leaveRequestsIndex(),
        icon: CalendarDays,
        module: 'leave_requests',
    },
    {
        title: 'IT Requests',
        description: 'Software and hardware request forms',
        href: itRequestsIndex(),
        icon: Cpu,
        module: 'it_requests',
    },
    {
        title: 'IT Asset Management',
        description: 'Asset issuance and signature tracking',
        href: '/it-asset-requests',
        icon: Cpu,
        module: 'it_asset_requests',
    },
    {
        title: 'Employee Requests',
        description: 'Travel and HR support requests',
        href: '/employee-requests',
        icon: Briefcase,
        module: 'employee_requests',
    },
    {
        title: 'Time & attendance',
        description: 'Daily logs and attendance actions',
        href: '/time-attendance',
        icon: Clock,
        module: 'time_attendance',
    },
    {
        title: 'Settings',
        description: 'Reference data and configuration',
        icon: Settings,
        items: [
            {
                title: 'Masters',
                icon: Table2,
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
                ],
            },
            {
                title: 'Company Profiles',
                href: companyProfilesIndex(),
                icon: Building2,
                module: 'company_profiles',
            },
            {
                title: 'Work timetables',
                href: workTimetablesIndex(),
                icon: Table2,
                module: 'work_timetables',
            },
            {
                title: 'User config',
                icon: UserCog,
                items: [
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
                ],
            },
        ],
    },
];

export function AppSidebar() {
    const { modulePermissions, auth } = usePage().props as {
        modulePermissions: unknown;
        auth?: {
            has_employee_profile?: boolean;
            has_my_profile_access?: boolean;
            has_leave_calendar_access?: boolean;
        };
    };

    const mainNavItems = useMemo(
        () => {
            const items = filterNavByModuleAccess(mainNavItemsSource, modulePermissions);
            const leaveCalendarItem = {
                title: 'Leave Calendar',
                description: 'Monthly approved leave visibility',
                href: '/leave-calendar',
                icon: CalendarDays,
            } satisfies NavItem;

            let withLeaveCalendar = items;
            if (auth?.has_leave_calendar_access) {
                const dashboardIndex = items.findIndex((item) => item.title === 'Dashboard');
                if (dashboardIndex >= 0) {
                    withLeaveCalendar = [
                        ...items.slice(0, dashboardIndex + 1),
                        leaveCalendarItem,
                        ...items.slice(dashboardIndex + 1),
                    ];
                } else {
                    withLeaveCalendar = [leaveCalendarItem, ...items];
                }
            }

            if (auth?.has_my_profile_access) {
                return [
                    ...withLeaveCalendar,
                    {
                        title: 'Profile',
                        description: 'Your employee information',
                        href: '/my-profile',
                        icon: UserRound,
                    },
                ] as NavItem[];
            }

            return withLeaveCalendar;
        },
        [modulePermissions, auth?.has_employee_profile, auth?.has_my_profile_access, auth?.has_leave_calendar_access],
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
        </Sidebar>
    );
}
