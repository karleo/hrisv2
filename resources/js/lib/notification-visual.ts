import { Bell, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react';
import type { NotificationItemData } from '@/lib/notifications';

export type NotificationVisualVariant = 'approved' | 'rejected' | 'activity';

export function notificationVisualVariant(
    data?: Pick<NotificationItemData, 'decision'> | null,
): NotificationVisualVariant {
    const decision = data?.decision?.toLowerCase();
    if (decision === 'approved') {
        return 'approved';
    }
    if (decision === 'rejected') {
        return 'rejected';
    }

    return 'activity';
}

export const NOTIFICATION_VARIANT_STYLES: Record<
    NotificationVisualVariant,
    {
        accentGradient: string;
        avatarRing: string;
        iconFallback: string;
        timerClass: string;
    }
> = {
    approved: {
        accentGradient: 'from-sky-400 via-sky-500 to-teal-500',
        avatarRing: 'ring-sky-300/90 dark:ring-sky-600/90',
        iconFallback: 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-200',
        timerClass: 'bg-sky-500/80 dark:bg-sky-400/90',
    },
    rejected: {
        accentGradient: 'from-rose-400 via-rose-500 to-red-700',
        avatarRing: 'ring-rose-300/90 dark:ring-rose-700/80',
        iconFallback: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-200',
        timerClass: 'bg-rose-500/80 dark:bg-rose-400/90',
    },
    activity: {
        accentGradient: 'from-orange-400 via-amber-400 to-rose-500',
        avatarRing: 'ring-emerald-300/90 dark:ring-emerald-700/80',
        iconFallback: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200',
        timerClass: 'bg-emerald-500/80 dark:bg-emerald-400/90',
    },
};

export function notificationVariantLucideIcon(variant: NotificationVisualVariant): LucideIcon {
    if (variant === 'approved') {
        return CheckCircle2;
    }
    if (variant === 'rejected') {
        return XCircle;
    }

    return Bell;
}
