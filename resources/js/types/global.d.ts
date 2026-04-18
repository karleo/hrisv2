import type { Auth } from '@/types/auth';
import type { ModulePermissionsMap } from '@/types/permissions';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            locale: 'en' | 'ar';
            locales: string[];
            auth: Auth;
            modulePermissions: ModulePermissionsMap;
            sidebarOpen: boolean;
            notifications: {
                unread_count: number;
                items: Array<{
                    id: string;
                    type: string;
                    data: Record<string, unknown>;
                    read_at: string | null;
                    created_at: string | null;
                }>;
            };
            [key: string]: unknown;
        };
    }
}
