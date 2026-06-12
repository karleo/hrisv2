import { usePoll } from '@inertiajs/react';

const INTERVAL_MS = 15000;

/**
 * Periodically refetches the given Inertia props on the current URL so status
 * (e.g. submitted → approved/rejected) updates without a manual refresh.
 */
export function useRequestStatusPoll(only: string[]): void {
    usePoll(
        INTERVAL_MS,
        {
            only,
            preserveScroll: true,
            preserveState: true,
        },
        { keepAlive: false },
    );
}
