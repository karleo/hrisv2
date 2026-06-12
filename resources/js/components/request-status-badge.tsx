import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function normalizeRequestStatus(status: string | null | undefined): string {
    const s = status?.toLowerCase().trim();
    return s && s.length > 0 ? s : 'draft';
}

function translatedRequestStatusLabel(
    status: string | null | undefined,
    t: (key: string, fallback?: string) => string,
): string {
    const n = normalizeRequestStatus(status);
    const map: Record<string, [string, string]> = {
        draft: ['requestStatus.draft', 'Draft'],
        submitted: ['requestStatus.submitted', 'Submitted'],
        approved: ['requestStatus.approved', 'Approved'],
        rejected: ['requestStatus.rejected', 'Rejected'],
        cancelled: ['requestStatus.cancelled', 'Cancelled'],
    };
    const entry = map[n];
    if (entry) {
        return t(entry[0], entry[1]);
    }

    return n.charAt(0).toUpperCase() + n.slice(1);
}

export function requestStatusBadgeColors(status: string | null | undefined): string {
    const n = normalizeRequestStatus(status);
    if (n === 'draft') {
        return 'border-amber-200/80 bg-amber-100 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200';
    }
    if (n === 'submitted') {
        return 'border-emerald-200/80 bg-emerald-100 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300';
    }
    if (n === 'approved') {
        return 'border-sky-200/80 bg-sky-100 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-200';
    }
    if (n === 'rejected') {
        return 'border-rose-200/80 bg-rose-100 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-200';
    }
    if (n === 'cancelled') {
        return 'border-slate-300/80 bg-slate-100 text-slate-800 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200';
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
    const { t } = useI18n();

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                requestStatusBadgeColors(status),
                className,
            )}
        >
            {translatedRequestStatusLabel(status, t)}
        </span>
    );
}
