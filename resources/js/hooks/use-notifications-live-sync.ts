import { router, usePoll } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

/**
 * Keeps the bell dropdown / unread badge closer to real time: short poll plus
 * a throttled reload when the user returns to the tab or window.
 */
export function useNotificationsLiveSync(): void {
    usePoll(
        4000,
        {
            only: ['notifications'],
            preserveScroll: true,
            preserveState: true,
        },
        { keepAlive: true },
    );

    const lastReloadAtRef = useRef(0);

    useEffect(() => {
        const reloadIfVisible = (): void => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            const now = Date.now();
            if (now - lastReloadAtRef.current < 1200) {
                return;
            }

            lastReloadAtRef.current = now;
            router.reload({
                only: ['notifications'],
                preserveScroll: true,
                preserveState: true,
            });
        };

        const onVisibilityChange = (): void => {
            reloadIfVisible();
        };

        window.addEventListener('focus', reloadIfVisible);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.removeEventListener('focus', reloadIfVisible);
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange,
            );
        };
    }, []);
}
