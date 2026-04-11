import { router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { NotificationRichRowInner } from '@/components/notification-rich-row-inner';
import {
    NOTIFICATION_VARIANT_STYLES,
    notificationVariantLucideIcon,
    notificationVisualVariant,
} from '@/lib/notification-visual';
import {
    formatNotificationSubtext,
    formatRequestDate,
    notificationHref,
} from '@/lib/notifications';
import { cn } from '@/lib/utils';

export type NotificationBellPayload = {
    unread_count: number;
    items: Array<{
        id: string;
        read_at?: string | null;
        data?: {
            request_code?: string;
            request_type?: string;
            request_date?: string;
            route?: string;
            request_id?: number;
            decision?: string;
            employee_photo_url?: string | null;
        };
    }>;
};

type ToastPayload = {
    title: string;
    body: string;
    dateLine: string;
    variant: ReturnType<typeof notificationVisualVariant>;
    href: string;
    employeePhotoUrl: string | null;
};

/**
 * Wraps the bell + notifications dropdown. When the unread count increases (e.g. after polling),
 * shows a short-lived panel under the bell while the badge and menu stay as they are.
 */
export function NotificationArrivalToastShell({
    notifications,
    children,
    durationMs = 3000,
}: {
    notifications: NotificationBellPayload | undefined;
    children: ReactNode;
    /** How long the popup stays visible before fading on its own. */
    durationMs?: number;
}) {
    const [toast, setToast] = useState<ToastPayload | null>(null);
    const readyRef = useRef(false);
    const prevUnreadRef = useRef(0);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const unread = notifications?.unread_count ?? 0;

    const clearHideTimer = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const dismissToast = useCallback(() => {
        clearHideTimer();
        setToast(null);
    }, [clearHideTimer]);

    useEffect(() => {
        return () => {
            clearHideTimer();
        };
    }, [clearHideTimer]);

    useEffect(() => {
        const firstItem = notifications?.items?.[0];

        if (!readyRef.current) {
            readyRef.current = true;
            prevUnreadRef.current = unread;

            return;
        }

        if (unread > prevUnreadRef.current) {
            clearHideTimer();

            const title = firstItem?.data?.request_code ?? 'New notification';
            const body =
                firstItem !== undefined
                    ? formatNotificationSubtext(firstItem.data)
                    : 'Open the bell to view your notifications.';
            const dateLine = formatRequestDate(firstItem?.data?.request_date);
            const variant = notificationVisualVariant(firstItem?.data);
            const href = firstItem !== undefined ? notificationHref(firstItem) : '#';
            const rawPhoto = firstItem?.data?.employee_photo_url;
            const employeePhotoUrl =
                typeof rawPhoto === 'string' && rawPhoto.trim() !== '' ? rawPhoto.trim() : null;

            queueMicrotask(() => {
                setToast({ title, body, dateLine, variant, href, employeePhotoUrl });
            });

            hideTimerRef.current = setTimeout(() => {
                setToast(null);
                hideTimerRef.current = null;
            }, durationMs);
        }

        prevUnreadRef.current = unread;
    }, [notifications, durationMs, unread, clearHideTimer]);

    const openFromToast = () => {
        if (!toast || toast.href === '' || toast.href === '#') {
            return;
        }
        dismissToast();
        router.visit(toast.href);
    };

    const Icon = toast ? notificationVariantLucideIcon(toast.variant) : notificationVariantLucideIcon('activity');
    const ui = toast ? NOTIFICATION_VARIANT_STYLES[toast.variant] : NOTIFICATION_VARIANT_STYLES.activity;

    return (
        <div className="relative">
            {toast ? (
                <div
                    className={cn(
                        'absolute top-full right-0 z-[100] mt-2 w-[min(24rem,calc(100vw-2rem))] max-w-[min(24rem,calc(100vw-2rem))]',
                        'animate-in fade-in-0 slide-in-from-top-2 zoom-in-95 duration-300',
                        'pointer-events-auto overflow-hidden rounded-2xl border border-border/60',
                        'bg-white text-foreground shadow-lg ring-1 ring-black/[0.06]',
                        'dark:bg-card dark:text-card-foreground dark:ring-white/10',
                    )}
                    aria-live="polite"
                >
                    <div className="relative flex">
                        <div
                            className={cn(
                                'w-1.5 shrink-0 self-stretch bg-gradient-to-b',
                                ui.accentGradient,
                            )}
                            aria-hidden
                        />
                        {toast.href !== '#' ? (
                            <button
                                type="button"
                                className="min-w-0 flex-1 text-left transition-colors hover:bg-muted/35"
                                onClick={openFromToast}
                            >
                                <NotificationRichRowInner
                                    key={toast.employeePhotoUrl ?? 'no-photo'}
                                    variant={toast.variant}
                                    Icon={Icon}
                                    employeePhotoUrl={toast.employeePhotoUrl}
                                    title={toast.title}
                                    body={toast.body}
                                    dateLine={toast.dateLine}
                                    hrefForSrOnly="Opens the request"
                                    className="px-4 py-3.5 pr-11"
                                />
                            </button>
                        ) : (
                            <div className="min-w-0 flex-1">
                                <NotificationRichRowInner
                                    key={toast.employeePhotoUrl ?? 'no-photo'}
                                    variant={toast.variant}
                                    Icon={Icon}
                                    employeePhotoUrl={toast.employeePhotoUrl}
                                    title={toast.title}
                                    body={toast.body}
                                    dateLine={toast.dateLine}
                                    hrefForSrOnly=""
                                    className="px-4 py-3.5 pr-11"
                                />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                dismissToast();
                            }}
                            className={cn(
                                'absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full',
                                'text-muted-foreground transition-colors hover:bg-muted/90 hover:text-foreground',
                                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                            )}
                            aria-label="Dismiss notification preview"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="h-1 bg-muted/50 dark:bg-muted/35">
                        <div
                            key={`${toast.title}-${toast.body}`}
                            className={cn('notification-toast-timer-bar h-full rounded-full', ui.timerClass)}
                            style={{ animationDuration: `${durationMs}ms` }}
                        />
                    </div>
                </div>
            ) : null}
            {children}
        </div>
    );
}
