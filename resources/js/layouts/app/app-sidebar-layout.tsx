import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { EmployeeMessageLiveSound } from '@/components/employee-message-live-sound';
import { NavigationLoadingOverlay } from '@/components/navigation-loading-overlay';
import { BiometricSyncProvider } from '@/contexts/biometric-sync-context';
import { EmployeePresenceProvider } from '@/contexts/employee-presence-context';
import { SidebarNavigationProvider } from '@/contexts/sidebar-navigation-context';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const year = new Date().getFullYear();
    const appVersion = import.meta.env.VITE_APP_VERSION || '1.12';

    return (
        <SidebarNavigationProvider>
            <AppShell variant="sidebar">
                <AppSidebar />
                <AppContent
                    variant="sidebar"
                    className="overflow-x-hidden"
                    dir="ltr"
                >
                    <NavigationLoadingOverlay />
                    <EmployeeMessageLiveSound />
                    <EmployeePresenceProvider>
                        <BiometricSyncProvider>
                            <AppSidebarHeader breadcrumbs={breadcrumbs} />
                            {children}
                        </BiometricSyncProvider>
                    </EmployeePresenceProvider>
                    <footer className="mt-auto border-t px-4 py-3 text-center text-xs text-muted-foreground md:px-6">
                        {`© ${year} Prime Logistics. All rights reserved. V ${appVersion}`}
                    </footer>
                </AppContent>
            </AppShell>
        </SidebarNavigationProvider>
    );
}
