import { useNotificationsHeaderSync } from '@/hooks/use-notifications-header-sync';
import type { NotificationBellPayload } from '@/components/notification-arrival-toast-shell';

/**
 * Keeps the bell dropdown / unread badge closer to real time without Inertia
 * partial reloads on the current page.
 */
export function useNotificationsLiveSync(
    initial: NotificationBellPayload | undefined,
): {
    notifications: NotificationBellPayload | undefined;
    refreshNotifications: () => Promise<void>;
} {
    return useNotificationsHeaderSync(initial);
}
