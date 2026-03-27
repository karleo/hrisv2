import type { Auth } from '@/types/auth';
import type { ModulePermissionsMap } from '@/types/permissions';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            modulePermissions: ModulePermissionsMap;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
