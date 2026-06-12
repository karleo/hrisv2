import type { Auth } from '@/types/auth';
import type { EmployeePresencePayload } from '@/types/employee-presence';
import type { ModulePermissionsMap } from '@/types/permissions';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            appVersion: string;
            locale: 'en' | 'ar';
            locales: string[];
            auth: Auth;
            viewerEmployeeId: number | null;
            employeePresence: EmployeePresencePayload;
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
