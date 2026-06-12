import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

const links = [
    { title: 'Devices', href: '/biometric-attendance' },
    { title: 'Connectivity', href: '/biometric-attendance/connectivity' },
    { title: 'Import attendance', href: '/biometric-attendance/import' },
    { title: 'Raw punches', href: '/biometric-attendance/punches' },
    { title: 'Sync history', href: '/biometric-attendance/sync-logs' },
] as const;

export function BiometricAttendanceNav({ currentPath }: { currentPath: string }) {
    return (
        <nav className="flex flex-wrap gap-2 border-b pb-3">
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    prefetch="hover"
                    className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        currentPath === link.href || (link.href !== '/biometric-attendance' && currentPath.startsWith(link.href))
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                >
                    {link.title}
                </Link>
            ))}
        </nav>
    );
}
