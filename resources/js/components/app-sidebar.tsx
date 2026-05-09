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
    Mail,
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
import { useI18n } from '@/lib/i18n';
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
import type { ModulePermissionsMap, NavItem } from '@/types';
import AppLogo from './app-logo';

function buildMainNavItems(t: (key: string, fallback?: string) => string): NavItem[] {
    return [
        {
        title: t('sidebar.dashboard', 'Dashboard'),
        description: 'Overview and quick metrics',
        href: dashboard(),
        icon: LayoutGrid,
        module: 'dashboard',
        },
        {
        title: t('sidebar.employees', 'Employees'),
        description: 'Manage employee records',
        href: employeesIndex(),
        icon: Users,
        module: 'employees',
        },
        {
        title: t('sidebar.leaveManagement', 'Leave Management'),
        description: 'Requests, approvals, and balances',
        href: leaveRequestsIndex(),
        icon: CalendarDays,
        module: 'leave_requests',
        },
        {
        title: t('sidebar.itRequests', 'IT Requests'),
        description: 'Software and hardware request forms',
        href: itRequestsIndex(),
        icon: Cpu,
        module: 'it_requests',
        },
        {
        title: t('sidebar.itAssetRequests', 'IT Asset Management'),
        description: 'Asset issuance and signature tracking',
        href: '/it-asset-requests',
        icon: Cpu,
        module: 'it_asset_requests',
        },
        {
        title: t('sidebar.employeeRequests', 'Employee Requests'),
        description: 'Travel and HR support requests',
        href: '/employee-requests',
        icon: Briefcase,
        module: 'employee_requests',
        },
        {
        title: t('sidebar.timeAttendance', 'Time & attendance'),
        description: 'Daily logs and attendance actions',
        href: '/time-attendance',
        icon: Clock,
        module: 'time_attendance',
        },
        {
        title: t('sidebar.settings', 'Settings'),
        description: 'Reference data and configuration',
        icon: Settings,
        items: [
            {
                title: t('sidebar.masters', 'Masters'),
                icon: Table2,
                items: [
                    {
                        title: t('sidebar.departments', 'Departments'),
                        href: departmentsIndex(),
                        icon: Building2,
                        module: 'departments',
                    },
                    {
                        title: t('sidebar.jobPositions', 'Job Positions'),
                        href: jobPositionsIndex(),
                        icon: Briefcase,
                        module: 'job_positions',
                    },
                    {
                        title: t('sidebar.countries', 'Countries'),
                        href: countriesIndex(),
                        icon: Globe,
                        module: 'countries',
                    },
                    {
                        title: t('sidebar.software', 'Software'),
                        href: softwareIndex(),
                        icon: AppWindow,
                        module: 'software',
                    },
                    {
                        title: t('sidebar.hardware', 'Hardware'),
                        href: hardwareIndex(),
                        icon: Cpu,
                        module: 'hardware',
                    },
                    {
                        title: t('sidebar.assetValues', 'Asset Values'),
                        href: '/hardware-asset-values',
                        icon: Cpu,
                        module: 'hardware',
                    },
                    {
                        title: t('sidebar.documentTypes', 'Document Types'),
                        href: '/document-types',
                        icon: Table2,
                        module: 'document_types',
                    },
                    {
                        title: t('sidebar.leaveTypes', 'Leave Types'),
                        href: leaveTypesIndex(),
                        icon: CalendarDays,
                        module: 'leave_types',
                    },
                ],
            },
            {
                title: t('sidebar.companyProfiles', 'Company Profiles'),
                href: companyProfilesIndex(),
                icon: Building2,
                module: 'company_profiles',
            },
            {
                title: t('sidebar.workTimetables', 'Work timetables'),
                href: workTimetablesIndex(),
                icon: Table2,
                module: 'work_timetables',
            },
            {
                title: t('sidebar.userConfig', 'User config'),
                icon: UserCog,
                items: [
                    {
                        title: t('sidebar.users', 'Users'),
                        href: '/users',
                        icon: UserRound,
                        module: 'user_management',
                    },
                    {
                        title: t('sidebar.roles', 'Roles'),
                        href: '/roles',
                        icon: Shield,
                        module: 'role_management',
                    },
                    {
                        title: t('sidebar.smtp', 'SMTP'),
                        href: '/settings/smtp',
                        icon: Mail,
                        module: 'user_management',
                    },
                ],
            },
        ],
        },
    ];
}

function hrefToUrl(href: NavItem['href']): string {
    if (!href) {
        return '';
    }
    if (typeof href === 'string') {
        return href;
    }
    if (typeof href === 'object' && 'url' in href) {
        return String((href as { url?: string }).url ?? '');
    }

    return '';
}

export function AppSidebar() {
    const { t } = useI18n();
    const { modulePermissions, auth } = usePage().props as {
        modulePermissions?: ModulePermissionsMap;
        auth?: {
            has_employee_profile?: boolean;
            has_my_profile_access?: boolean;
            has_leave_calendar_access?: boolean;
        };
    };

    const mainNavItems = useMemo(
        () => {
            const items = filterNavByModuleAccess(buildMainNavItems(t), modulePermissions);
            const leaveCalendarItem = {
                title: t('sidebar.leaveCalendar', 'Leave Calendar'),
                description: 'Monthly approved leave visibility',
                href: '/leave-calendar',
                icon: CalendarDays,
            } satisfies NavItem;

            let withLeaveCalendar = items;
            if (auth?.has_leave_calendar_access) {
                const dashboardIndex = items.findIndex(
                    (item) => hrefToUrl(item.href) === dashboard().url
                );
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
                return withLeaveCalendar;
            }

            return withLeaveCalendar;
        },
        [modulePermissions, auth?.has_employee_profile, auth?.has_my_profile_access, auth?.has_leave_calendar_access, t],
    );

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="[&_[data-sidebar=sidebar]]:bg-gradient-to-b [&_[data-sidebar=sidebar]]:from-[#363b78] [&_[data-sidebar=sidebar]]:via-[#2b2f66] [&_[data-sidebar=sidebar]]:to-[#1b1f47]"
        >
            <SidebarHeader className="border-b border-sidebar-border/70 p-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-12 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 px-2.5 shadow-sm hover:border-sidebar-border hover:bg-sidebar-accent/60"
                        >
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="py-2 pl-1.5 pr-0">
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden">
                    {t('sidebar.navigation', 'Navigation')}
                </p>
                <NavMain items={mainNavItems} />
            </SidebarContent>
        </Sidebar>
    );
}
