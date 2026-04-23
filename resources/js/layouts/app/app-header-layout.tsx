import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    const year = new Date().getFullYear();
    const appVersion = import.meta.env.VITE_APP_VERSION || '1.06';

    return (
        <AppShell>
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent>
                {children}
                <footer className="mt-auto border-t px-4 py-3 text-center text-xs text-muted-foreground">
                    {`© ${year} Prime Logistics. All rights reserved. V ${appVersion}`}
                </footer>
            </AppContent>
        </AppShell>
    );
}
