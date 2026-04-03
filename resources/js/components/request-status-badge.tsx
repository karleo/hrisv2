import { cn } from '@/lib/utils';

export function normalizeRequestStatus(status: string | null | undefined): string {
    const s = status?.toLowerCase().trim();
    return s && s.length > 0 ? s : 'draft';
}

export function requestStatusLabel(status: string | null | undefined): string {
    const n = normalizeRequestStatus(status);
    return n.charAt(0).toUpperCase() + n.slice(1);
}

export function requestStatusBadgeColors(status: string | null | undefined): string {
    const n = normalizeRequestStatus(status);
    if (n === 'submitted') {
        return 'border-emerald-200/80 bg-emerald-100 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300';
    }
    if (n === 'draft') {
        return 'border-amber-200/80 bg-amber-100 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200';
    }
    return 'border-muted-foreground/20 bg-muted text-muted-foreground';
}

export function RequestStatusBadge({
    status,
    className,
}: {
    status: string | null | undefined;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                requestStatusBadgeColors(status),
                className,
            )}
        >
            {requestStatusLabel(status)}
        </span>
    );
}
