import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NotificationBellPayload } from '@/components/notification-arrival-toast-shell';
import { getJsonRequestIntegrityHeaders } from '@/lib/request-integrity-headers';

const POLL_INTERVAL_MS = 4000;

/**
 * Polls notification bell data via JSON instead of Inertia partial reloads so
 * unrelated page props are not dropped on background visits.
 */
export function useNotificationsHeaderSync(
    initial: NotificationBellPayload | undefined,
): {
    notifications: NotificationBellPayload | undefined;
    refreshNotifications: () => Promise<void>;
} {
    const csrfToken =
        typeof usePage().props.csrf_token === 'string'
            ? usePage().props.csrf_token
            : null;

    const [notifications, setNotifications] = useState(initial);
    const lastReloadAtRef = useRef(0);

    useEffect(() => {
        setNotifications(initial);
    }, [initial]);

    const refreshNotifications = useCallback(async (): Promise<void> => {
        try {
            const response = await fetch('/notifications/header', {
                headers: getJsonRequestIntegrityHeaders(csrfToken),
                credentials: 'same-origin',
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as NotificationBellPayload;
            setNotifications(payload);
        } catch {
            // Ignore transient network errors; keep last known bell data.
        }
    }, [csrfToken]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            void refreshNotifications();
        }, POLL_INTERVAL_MS);

        const reloadIfVisible = (): void => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            const now = Date.now();
            if (now - lastReloadAtRef.current < 1200) {
                return;
            }

            lastReloadAtRef.current = now;
            void refreshNotifications();
        };

        window.addEventListener('focus', reloadIfVisible);
        document.addEventListener('visibilitychange', reloadIfVisible);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', reloadIfVisible);
            document.removeEventListener('visibilitychange', reloadIfVisible);
        };
    }, [refreshNotifications]);

    return { notifications, refreshNotifications };
}
